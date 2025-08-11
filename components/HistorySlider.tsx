import React from "react";
import { X } from "lucide-react";
import { HistoryItem, getFilteredHistory } from "@/lib/historyService";

interface HistorySliderProps {
  showHistorySlider: boolean;
  isClosing: boolean;
  historyData: HistoryItem[];
  historyLoading: boolean;
  searchQuery: string;
  isSearching: boolean;
  onClose: () => void;
  onSearchClick: () => void;
  onSearchInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearchClose: () => void;
  onNewChat: () => void;
  onViewChat: (chatId: string, chatTitle: string) => void;
}

export default function HistorySlider({
  showHistorySlider,
  isClosing,
  historyData,
  historyLoading,
  searchQuery,
  isSearching,
  onClose,
  onSearchClick,
  onSearchInputChange,
  onSearchClose,
  onNewChat,
  onViewChat,
}: HistorySliderProps) {
  if (!showHistorySlider) return null;

  const filteredHistory = getFilteredHistory(historyData, searchQuery);

  return (
    <div 
      className={`fixed inset-0 z-[70] transition-opacity duration-300 ${
        isClosing ? 'bg-black/0' : 'bg-black/50'
      }`} 
      onClick={onClose}
    >
      <div 
        className={`fixed right-0 top-0 h-full w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${
          isClosing ? 'translate-x-full' : 'translate-x-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#FF5146] flex items-center justify-center">
              <svg width="20" height="20" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-black">Your history</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="p-6 space-y-3">
          <button 
            onClick={onNewChat}
            className="w-full rounded-md px-4 py-3 bg-[#FFE4B5] border border-[#FF5146] text-black hover:bg-[#FFDAB9] transition-all duration-150 flex items-center gap-3 justify-center"
          >
            <svg width="20" height="20" fill="none" stroke="#FF5146" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span className="font-medium">New chat</span>
          </button>
          
          {!isSearching ? (
            <button 
              onClick={onSearchClick}
              className="w-full rounded-md px-4 py-3 bg-[#FFE4B5] border border-[#FF5146] text-black hover:bg-[#FFDAB9] transition-all duration-150 flex items-center gap-3 justify-center"
            >
              <svg width="20" height="20" fill="none" stroke="#FF5146" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="font-medium">Search chats</span>
            </button>
          ) : (
            <div className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by query or type..."
                  value={searchQuery}
                  onChange={onSearchInputChange}
                  className="w-full px-4 py-3 border border-[#FF5146] rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF5146] focus:ring-opacity-50"
                  autoFocus
                />
                <button
                  onClick={onSearchClose}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
                >
                  <X size={16} />
                </button>
              </div>
              {searchQuery && (
                <div className="text-sm text-gray-500">
                  Found {filteredHistory.length} result{filteredHistory.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          )}
        </div>

        {/* History Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 max-h-[calc(100vh-280px)]">
          <h3 className="text-lg font-bold text-black mb-4 sticky top-0 bg-white py-2">Chats</h3>
          
          {historyLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF5146] mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading history...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHistory.length > 0 ? (
                filteredHistory.map((item, index) => (
                  <div key={item.id || index} className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                    <div className="flex items-start gap-3">
                      {/* Icon based on type */}
                      <div className="w-5 h-5 mt-0.5 flex-shrink-0">
                        {item.type === "Image" && (
                          <svg width="20" height="20" fill="none" stroke="#FF5146" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        )}
                        {item.type === "Chat" && (
                          <svg width="20" height="20" fill="none" stroke="#FF5146" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        )}
                        {item.type === "Voice" && (
                          <svg width="20" height="20" fill="none" stroke="#FF5146" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                            <path d="M19 10v2a7 7 0 01-14 0v-2" />
                            <line x1="12" y1="19" x2="12" y2="23" />
                            <line x1="8" y1="23" x2="16" y2="23" />
                          </svg>
                        )}
                        {/* Default icon for unknown types */}
                        {!["Image", "Chat", "Voice"].includes(item.type) && (
                          <svg width="20" height="20" fill="none" stroke="#FF5146" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2 mb-1">
                          <span className="font-semibold text-black text-sm">{item.type}:</span>
                          <span className="text-black text-sm" style={{ 
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>{item.query}</span>
                        </div>
                        <p className="text-xs text-gray-500">{item.answeredBy}</p>
                        <p className="text-xs text-gray-400 mt-1">{item.date}</p>
                      </div>
                      
                      {/* View chat link */}
                      <button 
                        onClick={() => onViewChat(item.id as string, item.query)}
                        className="text-[#FF5146] text-xs font-medium hover:underline flex-shrink-0"
                      >
                        View
                      </button>
                    </div>
                  </div>
                ))
              ) : searchQuery ? (
                <div className="text-center py-8">
                  <svg width="48" height="48" fill="none" stroke="#9CA3AF" strokeWidth="1" viewBox="0 0 24 24" className="mx-auto mb-4">
                    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <p className="text-gray-500 text-lg font-medium">No chats found</p>
                  <p className="text-gray-400 text-sm mt-1">Try adjusting your search terms</p>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
