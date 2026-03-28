import { Sparkles } from 'lucide-react';
import { useState } from 'react';

interface AIAnalystCenterProps {
  onConfirm: () => void;
}

export function AIAnalystCenter({ onConfirm }: AIAnalystCenterProps) {
  const [aiInput, setAiInput] = useState('');

  return (
    <div className="flex-1 relative bg-white flex flex-col">
      {/* AI Analyst Header */}
      <div className="px-8 py-6 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-6 h-6 text-[#6B9695]" />
          <h3 
            className="text-[18px] text-gray-900"
            style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
          >
            AI Analyst
          </h3>
        </div>
        <p 
          className="text-[13px] text-gray-500"
          style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
        >
          Describe your usecase and I'll help structure it for the workshop
        </p>
      </div>

      {/* Chat Interface */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
        {/* User Message */}
        <div className="flex justify-end">
          <div className="bg-[#F5F3F0] rounded-xl rounded-tr-sm px-5 py-4 max-w-[70%]">
            <p 
              className="text-[14px] text-gray-900"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
            >
              We're seeing duplicate intake entries between Epic and the referral system.
            </p>
          </div>
        </div>

        {/* AI Response */}
        <div className="flex justify-start">
          <div className="bg-[#F0F9F9] border border-[#6B9695]/20 rounded-xl rounded-tl-sm px-5 py-4 max-w-[70%]">
            <p 
              className="text-[14px] text-gray-900"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
            >
              Would you classify this as operational inefficiency or system integration gap?
            </p>
          </div>
        </div>

        {/* User Message */}
        <div className="flex justify-end">
          <div className="bg-[#F5F3F0] rounded-xl rounded-tr-sm px-5 py-4 max-w-[70%]">
            <p 
              className="text-[14px] text-gray-900"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
            >
              System integration gap
            </p>
          </div>
        </div>

        {/* AI Structured Preview */}
        <div className="flex justify-start max-w-[70%]">
          <div className="bg-white border-2 border-[#6B9695] rounded-xl px-5 py-4 w-full shadow-md">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-[#6B9695]" />
              <span 
                className="text-[12px] text-[#6B9695]"
                style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
              >
                STRUCTURED PREVIEW
              </span>
            </div>

            <div className="space-y-3 mb-5">
              <div>
                <p 
                  className="text-[11px] text-gray-500 uppercase tracking-wide mb-1"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                >
                  Title
                </p>
                <p 
                  className="text-[14px] text-gray-900"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                >
                  Intake Form Duplication
                </p>
              </div>
              
              <div>
                <p 
                  className="text-[11px] text-gray-500 uppercase tracking-wide mb-1"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                >
                  Summary
                </p>
                <p 
                  className="text-[13px] text-gray-700"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                >
                  Manual re-entry across EHR systems
                </p>
              </div>

              <div className="flex gap-3">
                <div>
                  <p 
                    className="text-[11px] text-gray-500 uppercase tracking-wide mb-1"
                    style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                  >
                    Impact
                  </p>
                  <span
                    className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] border bg-red-50 text-red-700 border-red-200"
                    style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                  >
                    High
                  </span>
                </div>
                <div>
                  <p 
                    className="text-[11px] text-gray-500 uppercase tracking-wide mb-1"
                    style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                  >
                    Feasibility
                  </p>
                  <span
                    className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] border bg-blue-50 text-blue-700 border-blue-200"
                    style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                  >
                    Medium
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-200">
                <p 
                  className="text-[12px] text-gray-600"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                >
                  Similarity: <span className="text-[#6B9695] font-semibold">87%</span> to "EHR Data Sync Delays"
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onConfirm}
                className="flex-1 px-5 py-2.5 bg-[#6B9695] text-white hover:bg-[#5A8584] rounded-lg transition-colors text-[13px]"
                style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
              >
                Confirm & Add to Canvas
              </button>
              <button
                className="px-5 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-[13px]"
                style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
              >
                Refine
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="px-8 py-6 border-t border-gray-200">
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Describe a usecase..."
            value={aiInput}
            onChange={(e) => setAiInput(e.target.value)}
            className="flex-1 px-4 py-3 bg-[#FAFAF9] border border-gray-200 rounded-lg text-[14px] text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6B9695] focus:border-transparent transition-all"
            style={{ fontFamily: 'Inter, sans-serif' }}
          />
          <button
            className="px-6 py-3 bg-[#6B9695] text-white hover:bg-[#5A8584] rounded-lg transition-colors text-[14px]"
            style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
