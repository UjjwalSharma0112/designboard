"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, ArrowUp } from "lucide-react";
import { interviewClient } from "../interviewClient";

interface AnswerInputProps {
  disabled?: boolean;
  onSubmit: (answer: string) => void;
}

export default function AnswerInput({ disabled, onSubmit }: AnswerInputProps) {
  const [value, setValue] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [inputMode, setInputMode] = useState<"voice" | "text">("voice");

  const isRecordingRef = useRef(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  
  const valueRef = useRef("");
  const valueBeforeRecordingRef = useRef("");
  const shouldSubmitRef = useRef(false);
  const transcriptionSeqRef = useRef(0);
  const silenceStartRef = useRef<number>(0);
  const hasSpokenRef = useRef(false);

  const bar1Ref = useRef<HTMLDivElement>(null);
  const bar2Ref = useRef<HTMLDivElement>(null);
  const bar3Ref = useRef<HTMLDivElement>(null);
  const bar4Ref = useRef<HTMLDivElement>(null);
  const bar5Ref = useRef<HTMLDivElement>(null);

  const canSend = value.trim().length > 0 && !disabled && !isTranscribing;

  // Keep valueRef synchronized with the state value to prevent stale closures
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const cleanupConnections = useCallback(() => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch((err) => console.error("Error closing AudioContext:", err));
      audioContextRef.current = null;
    }
    analyserRef.current = null;

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    mediaRecorderRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      cleanupConnections();
    };
  }, [cleanupConnections]);

  const stopRecording = useCallback((autoSubmit = false) => {
    isRecordingRef.current = false;
    setIsRecording(false);
    shouldSubmitRef.current = autoSubmit;

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }

    cleanupConnections();
  }, [cleanupConnections]);

  const startSilenceDetection = useCallback((stream: MediaStream) => {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;

      const audioContext = new AudioContextClass();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const bufferLength = analyser.fftSize;
      const dataArray = new Uint8Array(bufferLength);

      silenceStartRef.current = Date.now();

      const checkSilence = () => {
        if (!isRecordingRef.current) return;

        analyser.getByteTimeDomainData(dataArray);

        // Calculate Root Mean Square (RMS) deviation from 128
        let sumSquares = 0;
        for (let i = 0; i < bufferLength; i++) {
          const deviation = dataArray[i] - 128;
          sumSquares += deviation * deviation;
        }
        const rms = Math.sqrt(sumSquares / bufferLength);

        // Update DJ Visualizer Bars
        if (bar1Ref.current && bar2Ref.current && bar3Ref.current && bar4Ref.current && bar5Ref.current) {
          const vol = Math.min(28, 4 + (rms * 0.9));
          bar1Ref.current.style.height = `${Math.max(4, vol * 0.5)}px`;
          bar2Ref.current.style.height = `${Math.max(4, vol * 0.95)}px`;
          bar3Ref.current.style.height = `${Math.max(4, vol * 0.75)}px`;
          bar4Ref.current.style.height = `${Math.max(4, vol * 1.0)}px`;
          bar5Ref.current.style.height = `${Math.max(4, vol * 0.6)}px`;
        }

        // Speech threshold: RMS >= 6.0 is speaking. Background noise is typically < 3.0.
        const isSpeaking = rms >= 6.0;

        console.log(`[STT Audio] Volume RMS: ${rms.toFixed(2)}, isSpeaking: ${isSpeaking}, silence elapsed: ${isSpeaking ? 0 : Math.round((Date.now() - silenceStartRef.current) / 1000)}s`);

        if (isSpeaking) {
          hasSpokenRef.current = true;
          silenceStartRef.current = Date.now();
        } else {
          const elapsed = Date.now() - silenceStartRef.current;
          // Only auto-submit if silence lasted 6.0s AND we have actually spoken during this session
          if (elapsed >= 6000 && hasSpokenRef.current) {
            console.log("Silence detected (6.0s). Auto-submitting response...");
            stopRecording(true);
            return;
          }
        }

        animationFrameIdRef.current = requestAnimationFrame(checkSilence);
      };

      animationFrameIdRef.current = requestAnimationFrame(checkSilence);
    } catch (err) {
      console.error("Failed to start silence detection:", err);
    }
  }, [stopRecording]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      valueBeforeRecordingRef.current = value;
      transcriptionSeqRef.current = 0;
      shouldSubmitRef.current = false;
      hasSpokenRef.current = false;

      recorder.ondataavailable = async (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);

          // Stream/Upload accumulated audio in 2-second chunks to the backend
          if (isRecordingRef.current) {
            const currentSeq = ++transcriptionSeqRef.current;
            const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });

            try {
              const response = await interviewClient.transcribe(audioBlob);
              
              // Only update if no newer transcription request has finished
              if (currentSeq === transcriptionSeqRef.current && isRecordingRef.current) {
                const transcribedText = response.text.trim();
                setValue(() => {
                  const base = valueBeforeRecordingRef.current.trim();
                  const space = base && transcribedText ? " " : "";
                  return base + space + transcribedText;
                });
              }
            } catch (error) {
              console.error("Error transcribing chunk:", error);
            }
          }
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        chunksRef.current = [];

        setIsTranscribing(true);
        const finalSeq = ++transcriptionSeqRef.current;
        
        try {
          const response = await interviewClient.transcribe(audioBlob);
          const transcribedText = response.text.trim();

          let finalValue = valueRef.current;
          if (finalSeq === transcriptionSeqRef.current) {
            const base = valueBeforeRecordingRef.current.trim();
            const space = base && transcribedText ? " " : "";
            finalValue = base + space + transcribedText;
            setValue(finalValue);
          }

          if (shouldSubmitRef.current) {
            if (finalValue.trim()) {
              onSubmit(finalValue.trim());
              setValue("");
            }
          }
        } catch (error) {
          console.error("Failed to transcribe final audio:", error);
          alert("Could not transcribe audio. Please try again or type your answer.");
        } finally {
          setIsTranscribing(false);
          shouldSubmitRef.current = false;
        }
      };

      setIsRecording(true);
      isRecordingRef.current = true;
      
      // Trigger ondataavailable every 2000ms (2 seconds)
      recorder.start(2000);

      startSilenceDetection(stream);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Microphone access is required for voice recording.");
    }
  }, [value, startSilenceDetection, onSubmit]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording(true);
    } else {
      startRecording();
    }
  }, [isRecording, stopRecording, startRecording]);

  const submit = useCallback(() => {
    if (isRecording) {
      stopRecording(true);
      return;
    }
    if (!canSend) return;
    onSubmit(value.trim());
    setValue("");
  }, [isRecording, stopRecording, canSend, value, onSubmit]);

  const onKeyDown = useCallback((event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      submit();
    }
  }, [submit]);

  const onTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    setValue(newVal);
    
    if (isRecordingRef.current) {
      valueBeforeRecordingRef.current = newVal;
      transcriptionSeqRef.current = 0; // reset sequence to avoid race overrides
    }
  }, []);

  if (inputMode === "voice") {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-surface/80 border border-line rounded-3xl shadow-soft backdrop-blur-md transition-all duration-300">
        <div className="relative flex items-center justify-center h-32 w-32">
          {/* Circular voice button */}
          <button
            type="button"
            onClick={toggleRecording}
            disabled={disabled || isTranscribing}
            className={`relative z-10 flex h-20 w-20 items-center justify-center rounded-full transition-all duration-300 ${
              isRecording 
                ? "bg-red-500 hover:bg-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)]" 
                : "bg-accent hover:bg-accent/90 text-accent-contrast shadow-[0_0_15px_rgba(var(--accent-rgb),0.3)] hover:scale-105"
            } disabled:opacity-40`}
          >
            {isTranscribing ? (
              <span className="h-8 w-8 animate-spin rounded-full border-3 border-current border-t-transparent" />
            ) : isRecording ? (
              <div className="flex items-end justify-center gap-[3px] h-8 w-12 pb-[2px]">
                <div ref={bar1Ref} className="w-[3px] bg-white rounded-full transition-all duration-75 h-[6px]" />
                <div ref={bar2Ref} className="w-[3px] bg-white rounded-full transition-all duration-75 h-[6px]" />
                <div ref={bar3Ref} className="w-[3px] bg-white rounded-full transition-all duration-75 h-[6px]" />
                <div ref={bar4Ref} className="w-[3px] bg-white rounded-full transition-all duration-75 h-[6px]" />
                <div ref={bar5Ref} className="w-[3px] bg-white rounded-full transition-all duration-75 h-[6px]" />
              </div>
            ) : (
              <Mic className="h-8 w-8" />
            )}
          </button>
        </div>

        <div className="mt-2 text-center">
          <p className="text-sm font-medium text-fg">
            {isTranscribing 
              ? "Transcribing final audio..." 
              : isRecording 
                ? "Listening..." 
                : "Tap microphone to speak"}
          </p>
          <p className="mt-1 text-[11px] text-faint font-body h-5">
            {isRecording && "Speak, then pause 6s or tap stop to submit"}
          </p>
        </div>

        {/* Live transcription preview text box */}
        {value && (
          <div className="w-full mt-4 p-3 bg-surface-dark/40 border border-line/60 rounded-card text-sm text-fg max-h-24 overflow-y-auto font-body leading-relaxed text-center italic">
            &ldquo;{value}&rdquo;
          </div>
        )}

        {/* Switch mode button */}
        <button
          type="button"
          onClick={() => {
            if (isRecording) stopRecording(false);
            setInputMode("text");
          }}
          disabled={disabled || isTranscribing}
          className="mt-6 text-[11px] text-muted hover:text-fg font-mono uppercase tracking-wider underline underline-offset-4 decoration-line hover:decoration-fg transition-all"
        >
          Type instead
        </button>
      </div>
    );
  }

  // Text mode
  return (
    <div className="flex flex-col rounded-card border border-line bg-surface/70 p-3 shadow-soft backdrop-blur transition-all duration-300">
      <label htmlFor="answer" className="sr-only">
        Your answer
      </label>
      <textarea
        id="answer"
        value={value}
        disabled={disabled}
        onChange={onTextareaChange}
        onKeyDown={onKeyDown}
        rows={4}
        placeholder="Take your time. Type in specifics…"
        className="w-full resize-none bg-transparent px-2 py-1.5 font-body text-base leading-relaxed text-fg placeholder:text-faint focus:outline-none disabled:opacity-60"
      />
      <div className="mt-1 flex items-center justify-between gap-3 px-1">
        {/* Toggle mode link */}
        <button
          type="button"
          onClick={() => setInputMode("voice")}
          disabled={disabled}
          className="text-[11px] text-muted hover:text-fg font-mono uppercase tracking-wider underline underline-offset-4 decoration-line hover:decoration-fg transition-all"
        >
          Speak instead
        </button>

        <div className="flex items-center gap-3">
          <span className="hidden font-mono text-[11px] text-faint sm:inline">
            ⌘ / Ctrl + Enter
          </span>
          <button
            type="button"
            onClick={submit}
            disabled={!canSend}
            className="flex items-center gap-1.5 rounded-pill bg-accent px-4 py-2 text-sm font-medium text-accent-contrast transition-opacity disabled:opacity-40"
          >
            Send
            <ArrowUp className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
