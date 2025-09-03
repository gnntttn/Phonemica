import React from 'react';

interface CallControlsProps {
  isLoading: boolean;
  isRecording: boolean;
  onToggleRecording: () => void;
  hasSpeechApi: boolean;
}

const CallControls: React.FC<CallControlsProps> = ({ isLoading, isRecording, onToggleRecording, hasSpeechApi }) => {
    if (!hasSpeechApi) {
        return <p className="text-center text-red-500">Speech recognition is not supported in your browser.</p>
    }

  return (
    <div className="flex items-center justify-center h-16">
      <button
        type="button"
        onClick={onToggleRecording}
        disabled={isLoading}
        aria-label={isRecording ? 'Stop recording' : 'Start recording'}
        className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 transform scale-100 hover:scale-105 active:scale-95 shadow-lg
          ${isRecording ? 'bg-gradient-to-br from-red-500 to-orange-500 animate-pulse' : 'bg-gradient-to-br from-teal-400 to-blue-500'} 
          ${isLoading ? 'bg-gray-400 cursor-not-allowed' : ''}
        `}
      >
        {isLoading ? (
          <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        )}
      </button>
    </div>
  );
};

export default CallControls;