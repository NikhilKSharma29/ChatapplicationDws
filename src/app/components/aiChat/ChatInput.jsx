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
  const [isListening, setIsListening] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const [simulatedText, setSimulatedText] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [transcriptionText, setTranscriptionText] = useState('');
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

  // Simulate typing effect for transcription
  const simulateTyping = (text, onComplete) => {
    setIsSimulating(true);
    const words = text.split(' ');
    let currentText = '';
    let index = 0;

    const typeNextWord = () => {
      if (index < words.length) {
        currentText += (index > 0 ? ' ' : '') + words[index];
        setSimulatedText(currentText);
        index++;
        setTimeout(typeNextWord, Math.random() * 200 + 100); // Random delay between words
      } else {
        setIsSimulating(false);
        onComplete?.(currentText);
      }
    };

    typeNextWord();
  };

  const startRecording = async () => {
    try {
      setIsListening(true);
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
        setIsListening(false);
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        
        // Show loading toast
        const toastId = toast.loading('Transcribing audio...');
        setIsTranscribing(true);
        
        try {
          // Simulate API call with a timeout
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // This is a simulated response - in a real app, you'd get this from your API
          const simulatedResponse = {
            text: "This is a simulated transcription of your voice message. In a real app, this would be the actual transcribed text from your audio."
          };
          
          // Simulate typing effect for the transcription
          simulateTyping(simulatedResponse.text, (fullText) => {
            // Once typing is complete, update the input field
            setInput(prev => prev ? `${prev} ${fullText}` : fullText);
            setSimulatedText('');
            toast.success('Transcription complete', { id: toastId });
          });
          
        } catch (error) {
          console.error('Transcription error:', error);
          toast.error('Failed to transcribe audio', { id: toastId });
          // Fallback to a simple message if transcription fails
          setInput(prev => prev ? `${prev} [Voice message]` : '[Voice message]');
          setSimulatedText('');
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
      setIsListening(false);
    }
    setRecordingTime(0);
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
    <form
      onSubmit={handleSend}
      className={`sticky bottom-0 w-full bg-white dark:bg-gray-900 border-t transition-colors duration-200 ${
        isFocused
          ? "border-blue-500 dark:border-blue-600"
          : "border-gray-200 dark:border-gray-600"
      }`}
    >
      <div className="flex items-center px-4 py-2 bg-white dark:bg-gray-800 rounded-full shadow-sm border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
        <button
          type="button"
          onClick={handleFileUpload}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none"
          aria-label="Attach file"
        >
          <FiPaperclip className="w-5 h-5" />
        </button>
        
        {/* Listening indicator */}
        {isListening && (
          <div className="flex items-center ml-2 text-sm text-blue-500">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            <span className="ml-2">Listening...</span>
          </div>
        )}

        {/* Text input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={isSimulating ? simulatedText : input}
            onChange={(e) => !isSimulating && setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={isListening ? "" : "Type a message..."}
            className="w-full bg-transparent border-none focus:ring-0 focus:outline-none focus:ring-transparent resize-none py-2 px-2 max-h-32 text-sm md:text-base text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            rows="1"
            disabled={isSending || isTranscribing || isSimulating}
          />
          {isSimulating && (
            <div className="absolute bottom-1 right-2 text-xs text-gray-400">
              Transcribing...
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center pr-2">
          <AnimatePresence>
            {input.trim() || isSimulating ? (
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
