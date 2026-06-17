"use client";

import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { interviewClient } from "../interviewClient";
import type { SessionConfig, FeedbackResponse, Turn } from "@/lib/types";
import SetupPanel from "./SetupPanel";
import QuestionCard from "./QuestionCard";
import AnswerInput from "./AnswerInput";
import ThinkingIndicator from "./ThinkingIndicator";
import LiveTranscript from "./LiveTranscript";
import InterviewProgress from "./InterviewProgress";
import ReportView from "@/features/report/components/ReportView";
import { useAuth } from "@/features/auth/AuthProvider";
import { useToast } from "@/features/toast/ToastProvider";

type Phase = "INTRO" | "INTERVIEW" | "REPORT";

export default function InterviewRunner() {
  const { status } = useAuth();
  const { showToast } = useToast();
  const [phase, setPhase] = useState<Phase>("INTRO");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<{ 
    question: string; 
    questionNumber: number; 
    isFollowUp: boolean;
  } | null>(null);
  const [totalQuestions, setTotalQuestions] = useState(5);
  const [isThinking, setIsThinking] = useState(false);
  const [transcript, setTranscript] = useState<Turn[]>([]);
  const [report, setReport] = useState<FeedbackResponse | null>(null);

  function getCleanErrorMessage(err: unknown): string {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("500") || msg.toLowerCase().includes("internal server error")) {
      return "Error (500): The server encountered an error.";
    }
    if (msg.includes("401") || msg.toLowerCase().includes("unauthorized") || msg.toLowerCase().includes("auth")) {
      return "Error (401): Session is unauthorized.";
    }
    if (msg.includes("404") || msg.toLowerCase().includes("not found")) {
      return "Error (404): Session not found.";
    }
    if (msg.toLowerCase().includes("api key") || msg.toLowerCase().includes("generative") || msg.toLowerCase().includes("google")) {
      return "Error (500): The AI service failed to respond.";
    }
    const lowerMsg = msg.toLowerCase();
    if (
      lowerMsg.includes("fetch") || 
      lowerMsg.includes("refused") || 
      lowerMsg.includes("econnrefused") || 
      lowerMsg.includes("network") || 
      lowerMsg.includes("load failed") ||
      lowerMsg.includes("connection failed")
    ) {
      return "Error: Failed to connect to server (Connection Refused).";
    }
    return `Error: ${msg}`;
  }
  
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isStarting, setIsStarting] = useState(() => {
    if (typeof window !== "undefined") {
      return !!sessionStorage.getItem("interview_room.active_session_id");
    }
    return false;
  });

  const [isTtsEnabled, setIsTtsEnabled] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("interview_room.tts_enabled");
      return saved === "true";
    }
    return false;
  });

  const handleToggleTts = (enabled: boolean) => {
    setIsTtsEnabled(enabled);
    if (typeof window !== "undefined") {
      localStorage.setItem("interview_room.tts_enabled", String(enabled));
    }
  };
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const isStreamingRef = useRef<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  function stopAudio() {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    isStreamingRef.current = false;
    activeSourcesRef.current.forEach((source) => {
      source.onended = null;
      try {
        source.stop();
      } catch {
        // ignore
      }
    });
    activeSourcesRef.current = [];
    setIsPlayingAudio(false);
  }

  function playBufferChunk(floatSamples: Float32Array, ctx: AudioContext) {
    const audioBuffer = ctx.createBuffer(1, floatSamples.length, 24000);
    audioBuffer.getChannelData(0).set(floatSamples);
    
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    
    const startTime = Math.max(nextStartTimeRef.current, ctx.currentTime);
    source.start(startTime);
    nextStartTimeRef.current = startTime + audioBuffer.duration;
    
    activeSourcesRef.current.push(source);
    source.onended = () => {
      activeSourcesRef.current = activeSourcesRef.current.filter((s) => s !== source);
      if (activeSourcesRef.current.length === 0 && !isStreamingRef.current) {
        setIsPlayingAudio(false);
      }
    };
  }

  async function playQuestionAudio(
    text: string,
    questionMetadata: { question: string; questionNumber: number; isFollowUp: boolean }
  ) {
    stopAudio();
    if (typeof window === "undefined") return;

    if (!isTtsEnabled) {
      setCurrentQuestion(questionMetadata);
      setIsThinking(false);
      setIsStarting(false);
      return;
    }

    isStreamingRef.current = true;
    let isFirstChunk = true;

    try {
      if (!audioContextRef.current) {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioContextRef.current = new AudioContextClass();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") {
        await ctx.resume();
      }
      nextStartTimeRef.current = ctx.currentTime;

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      const stream = await interviewClient.getSpeechStream(text);
      const reader = stream.getReader();

      let remainder: Uint8Array | null = null;

      while (true) {
        if (abortController.signal.aborted) break;
        const { done, value } = await reader.read();
        if (done) break;

        let bytes = value;
        if (remainder) {
          const newBytes = new Uint8Array(remainder.length + bytes.length);
          newBytes.set(remainder);
          newBytes.set(bytes, remainder.length);
          bytes = newBytes;
          remainder = null;
        }

        const sampleCount = Math.floor(bytes.length / 2);
        if (sampleCount === 0) {
          remainder = bytes;
          continue;
        }

        const pcmBytes = bytes.subarray(0, sampleCount * 2);
        if (bytes.length % 2 !== 0) {
          remainder = bytes.subarray(sampleCount * 2);
        }

        const alignedBytes = new Uint8Array(pcmBytes);
        const int16Samples = new Int16Array(alignedBytes.buffer);
        const floatSamples = new Float32Array(sampleCount);
        for (let i = 0; i < sampleCount; i++) {
          floatSamples[i] = int16Samples[i] / 32768.0;
        }

        if (abortController.signal.aborted) break;

        if (isFirstChunk) {
          setCurrentQuestion(questionMetadata);
          setIsPlayingAudio(true);
          setIsThinking(false);
          setIsStarting(false);
          isFirstChunk = false;
        }

        playBufferChunk(floatSamples, ctx);
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        // Ignored
      } else {
        console.error("Audio streaming error:", err);
      }
    } finally {
      isStreamingRef.current = false;
      if (isFirstChunk) {
        setCurrentQuestion(questionMetadata);
        setIsThinking(false);
        setIsStarting(false);
      }
      if (activeSourcesRef.current.length === 0) {
        setIsPlayingAudio(false);
      }
    }
  }

  // Restore session on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const activeSessionId = sessionStorage.getItem("interview_room.active_session_id");
    if (!activeSessionId) return;

    let active = true;

    interviewClient.getSession(activeSessionId)
      .then((state) => {
        if (!active) return;
        
        // Reconstruct transcript from session history
        const restoredTranscript: Turn[] = [];
        state.history.forEach((record) => {
          restoredTranscript.push({
            question: record.question,
            answer: record.answer,
            type: "question",
            questionNumber: record.questionIndex + 1,
          });
          record.followUps.forEach((followUp) => {
            restoredTranscript.push({
              question: followUp.question,
              answer: followUp.answer,
              type: "follow_up",
              questionNumber: record.questionIndex + 1,
            });
          });
        });

        setSessionId(state.sessionId);
        setTotalQuestions(state.questions.length);

        if (state.phase === "END") {
          // If session has ended, load report
          interviewClient.getFeedback(state.sessionId)
            .then((feedback) => {
              if (!active) return;
              setReport(feedback);
              setPhase("REPORT");
              setIsStarting(false);
            })
            .catch((err) => {
              console.error("Failed to load feedback for ended session:", err);
              sessionStorage.removeItem("interview_room.active_session_id");
              setIsStarting(false);
            });
        } else {
          // Restore interview state
          setTranscript(restoredTranscript);
          setPhase("INTERVIEW");

          if (state.currentRecord) {
            const evaluation = state.currentRecord.evaluation;
            const isFollowUpPhase = state.phase === "FOLLOW_UP_QUESTION" && evaluation?.followUpQuestion;

            setCurrentQuestion({
              question: isFollowUpPhase ? evaluation.followUpQuestion! : state.currentRecord.question,
              questionNumber: state.currentQuestionIndex + 1,
              isFollowUp: !!isFollowUpPhase,
            });
          }
          setIsStarting(false);
        }
      })
      .catch((err) => {
        console.error("Failed to restore active session:", err);
        sessionStorage.removeItem("interview_room.active_session_id");
        setIsStarting(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      stopAudio();
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(console.error);
      }
    };
  }, []);

  // Auto-start interview if returning from login/signup after drawing a diagram unauthorized
  useEffect(() => {
    if (typeof window === "undefined" || status !== "authenticated") return;
    const autoStart = sessionStorage.getItem("practice.auto_start_interview");
    if (autoStart !== "true") return;

    const savedQuestionStr = sessionStorage.getItem("system_design_playground.selected_question");
    if (!savedQuestionStr) return;

    try {
      const selectedQuestion = JSON.parse(savedQuestionStr);
      const savedDiagramStr = sessionStorage.getItem(`playground_diagram_${selectedQuestion.id}`);
      if (savedDiagramStr) {
        const parsedDiagram = JSON.parse(savedDiagramStr);
        const transformedNodes = (parsedDiagram.nodes || []).map((n: any) => ({
          id: n.id,
          type: n.type,
          label: n.label,
          tag: n.tag,
          data: { label: n.label, type: n.type, tag: n.tag },
        }));
        const transformedEdges = (parsedDiagram.edges || []).map((e: any) => ({
          from: e.from,
          to: e.to,
          descriptor: e.descriptor,
          tag: e.tag,
          source: e.from,
          target: e.to,
          label: e.descriptor,
        }));
        const serialized = JSON.stringify({ nodes: transformedNodes, edges: transformedEdges });

        // Clean session and local storage draft state upon starting the interview
        sessionStorage.removeItem("system_design_playground.selected_question");
        sessionStorage.removeItem(`playground_diagram_${selectedQuestion.id}`);
        sessionStorage.removeItem("practice.auto_start_interview");
        localStorage.removeItem("system_design_playground.selected_question");
        localStorage.removeItem(`playground_diagram_${selectedQuestion.id}`);

        handleStart({
          topic: selectedQuestion.title,
          difficulty: selectedQuestion.difficulty,
          interviewContext: serialized,
        });
      }
    } catch (err) {
      console.error("Auto-start interview failed:", err);
    }
  }, [status]);

  async function handleStart(config: SessionConfig) {
    setIsStarting(true);
    try {
      const res = await interviewClient.start(config);
      setSessionId(res.sessionId);
      setTotalQuestions(res.totalQuestions);
      setPhase("INTERVIEW");
      
      if (typeof window !== "undefined") {
        sessionStorage.setItem("interview_room.active_session_id", res.sessionId);
      }
      
      if (res.question) {
        await playQuestionAudio(res.question, {
          question: res.question,
          questionNumber: res.questionNumber,
          isFollowUp: false,
        });
      } else {
        setIsStarting(false);
      }
    } catch (err: unknown) {
      showToast(getCleanErrorMessage(err));
      setIsStarting(false);
    }
  }

  async function handleSubmit(answer: string) {
    if (!sessionId || !currentQuestion) return;
    
    stopAudio();

    // Optimistically add the current question + answer to transcript
    const currentTurn: Turn = {
      question: currentQuestion.question,
      answer,
      questionNumber: currentQuestion.questionNumber,
      type: currentQuestion.isFollowUp ? "follow_up" : "question",
    };
    setTranscript((prev) => [...prev, currentTurn]);
    setIsThinking(true);

    try {
      const res = await interviewClient.answer(sessionId, answer);
      if (res.type === "end" || res.isFinal) {
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("interview_room.active_session_id");
        }
        const feedback = await interviewClient.getFeedback(sessionId);
        setReport(feedback);
        setPhase("REPORT");
        setIsThinking(false);
      } else {
        setTotalQuestions(res.totalQuestions);
        if (res.question) {
          await playQuestionAudio(res.question, {
            question: res.question,
            questionNumber: res.questionNumber!,
            isFollowUp: res.type === "follow_up",
          });
        } else {
          setIsThinking(false);
        }
      }
    } catch (err: unknown) {
      showToast(getCleanErrorMessage(err));
      setIsThinking(false);
    }
  }

  if (isStarting) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6" role="status" aria-live="polite">
        <div className="relative flex h-24 w-24 items-center justify-center">
          {/* Breathing ambient ring */}
          <motion.div
            className="absolute inset-0 rounded-full border border-accent/20 bg-accent-soft"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 2.4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          {/* Core circle */}
          <div className="relative h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center border border-accent/30">
            <span className="h-3 w-3 rounded-full bg-accent animate-ping" />
          </div>
        </div>
        <div className="text-center space-y-2">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent animate-pulse">
            Configuring Room...
          </p>
          <p className="text-xs text-muted max-w-xs leading-relaxed px-6">
            The interviewer is generating your personalized questions. Please wait...
          </p>
        </div>
      </div>
    );
  }

  if (phase === "INTRO") {
    return (
      <div className="flex w-full flex-1 items-stretch justify-center">
        <SetupPanel 
          onStart={handleStart} 
          isTtsEnabled={isTtsEnabled}
          onToggleTts={handleToggleTts}
        />
      </div>
    );
  }

  if (phase === "REPORT" && report) {
    return (
      <ReportView 
        report={report} 
        onRestart={() => {
          if (typeof window !== "undefined") {
            sessionStorage.removeItem("interview_room.active_session_id");
          }
          window.location.reload();
        }} 
      />
    );
  }

  return (
    <div className="mx-auto flex min-h-[80vh] w-full max-w-2xl flex-col gap-8 py-6">
      <InterviewProgress
        current={currentQuestion?.questionNumber ?? 0}
        planned={totalQuestions}
        onEnd={() => {
          stopAudio();
          if (typeof window !== "undefined") {
            sessionStorage.removeItem("interview_room.active_session_id");
          }
          setPhase("INTRO");
          setSessionId(null);
          setCurrentQuestion(null);
          setTranscript([]);
          setReport(null);
        }}
      />

      <div className="flex flex-1 flex-col justify-center gap-8">
        {currentQuestion && (
          <QuestionCard
            turnId={`${currentQuestion.questionNumber}-${currentQuestion.isFollowUp ? "followup" : "main"}`}
            question={currentQuestion.question}
            index={currentQuestion.questionNumber}
            isFollowUp={currentQuestion.isFollowUp}
            isSpeaking={isPlayingAudio}
          />
        )}

        <div className="min-h-[7.5rem]">
          <AnimatePresence mode="wait">
            {isThinking ? (
              <motion.div key="thinking">
                <ThinkingIndicator />
              </motion.div>
            ) : (
              <motion.div
                key="answer"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
              >
                <AnswerInput
                  disabled={isThinking}
                  onSubmit={handleSubmit}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <LiveTranscript turns={transcript} />
    </div>
  );
}
