import ChatMessageList from './ChatMessageList';
import ChatComposer from './ChatComposer';

export default function AuthChatCard() {
  return (
    <div className="mt-8 w-full max-w-xl">
      <div className="rounded-2xl overflow-hidden border border-border bg-card shadow-soft">
        <div className="flex items-center gap-3 bg-primary text-primary-foreground px-5 py-4">
          <img
            alt="agent"
            className="w-10 h-10 rounded-full object-cover"
            src="/assets/agents/sage-agent-icon.svg"
          />
          <div className="font-semibold text-lg">
            Leo <span className="font-normal opacity-90">— AI Search Engine</span>
          </div>
        </div>

        <ChatMessageList />
        <div className="p-4 border-t border-border">
          <ChatComposer />
        </div>
      </div>
    </div>
  );
}
