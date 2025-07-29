"use client";
import { useState, useEffect, useRef } from "react";
import { FiSend, FiPaperclip, FiMic, FiSquare, FiCircle } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import toast from 'react-hot-toast';

export default function ChatInput({ onSendMessage, isSending = false }) {
  const [input, setInput] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const textareaRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordingInterval = useRef(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleSend = (e) => {
    e?.preventDefault();
    const message = input.trim();
    if (!message) return;

    onSendMessage(message);
    setInput("");
    // Reset textarea height after sending
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  const handleFileUpload = () => {
    console.log("File upload clicked");
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      setMediaRecorder(recorder);
      const chunks = [];
      setAudioChunks(chunks);
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        
        // Show loading toast
        const toastId = toast.loading('Transcribing audio...');
        setIsTranscribing(true);
        
        try {
          // Create form data to send the audio file
          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.webm');
          
          // Call the transcription API
          const response = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData,
          });
          
          if (!response.ok) {
            throw new Error('Transcription failed');
          }
          
          const data = await response.json();
          
          // Update the input with the transcribed text
          setInput(prev => prev ? `${prev} ${data.text}` : data.text);
          toast.success('Transcription complete', { id: toastId });
          
        } catch (error) {
          console.error('Transcription error:', error);
          toast.error('Failed to transcribe audio', { id: toastId });
          // Fallback to a simple message if transcription fails
          setInput(prev => prev ? `${prev} [Voice message]` : '[Voice message]');
        } finally {
          setIsTranscribing(false);
        }
      };

      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start recording timer
      recordingInterval.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Could not access microphone. Please ensure you have granted microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      clearInterval(recordingInterval.current);
      setIsRecording(false);
      setRecordingTime(0);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Clean up recording resources on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      clearInterval(recordingInterval.current);
    };
  }, []);

  return (
    <form onSubmit={handleSend} className="w-full">
      <div
        className={`relative flex  items-center w-full bg-white dark:bg-gray-800 rounded-2xl border transition-all duration-200 ${
          isFocused
            ? "border-blue-400 dark:border-blue-600 ring-2 ring-blue-100 dark:ring-blue-900/50"
            : "border-gray-200 dark:border-gray-600"
        }`}
      >
        <button
          type="button"
          onClick={handleFileUpload}
          className="p-2 text-gray-400 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
          aria-label="Attach file"
        >
          <FiPaperclip className="w-5 h-5" />
        </button>

        {/* Text input */}
        <div className="flex-1 min-w-0">
          <textarea
            ref={textareaRef}
            rows={1}
            placeholder={
              isSending ? "AI is responding..." : "Type your message..."
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => !isSending && setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={isSending}
            className={`w-full outline-none px-2 py-3 bg-transparent border-0 focus:ring-0 resize-none overflow-hidden max-h-32 scrollbar-hide ${
              isSending ? "cursor-not-allowed opacity-70" : ""
            }`}
            style={{ minHeight: "44px" }}
          />
        </div>

        {/* Action buttons */}
        <div className="flex items-center pr-2">
          <AnimatePresence>
            {input.trim() ? (
              <motion.button
                type="submit"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="p-2 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                disabled={isSending}
                aria-label="Send message"
              >
                {isSending ? (
                  <div className="w-5 h-5 border-2 border-blue-500 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <FiSend className="w-5 h-5" />
                )}
              </motion.button>
            ) : (
              <button
                type="button"
                onClick={toggleRecording}
                className={`p-2 transition-colors ${
                  isRecording 
                    ? 'text-red-500 animate-pulse' 
                    : 'text-gray-400 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400'
                } ${isTranscribing ? 'opacity-50 cursor-not-allowed' : ''}`}
                aria-label={isRecording ? 'Stop recording' : 'Start voice recording'}
                disabled={isTranscribing}
              >
                {isTranscribing ? (
                  <div className="w-5 h-5 border-2 border-blue-500 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                ) : isRecording ? (
                  <div className="flex items-center gap-1">
                    <FiSquare className="w-4 h-4" />
                    <span className="text-xs">{recordingTime}s</span>
                  </div>
                ) : (
                  <FiMic className="w-5 h-5" />
                )}
              </button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Recording indicator and character counter */}
      <div className="mt-1 flex justify-between items-center">
        {isRecording && (
          <div className="flex items-center text-xs text-red-500">
            <FiCircle className="w-2 h-2 mr-1 animate-pulse" />
            <span>Recording... {recordingTime}s</span>
          </div>
        )}
        <span
          className={`text-xs ml-auto ${
            input.length > 500
              ? "text-red-500"
              : "text-gray-400 dark:text-gray-500"
          }`}
        >
          {input.length}/500
        </span>
      </div>
    </form>
  );
}
