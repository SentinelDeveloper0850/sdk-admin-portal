import { useEffect, useRef, useState } from "react";

import { Spinner } from "@nextui-org/react";
import dayjs from "dayjs";

import { IClaimComment } from "@/app/models/claim.schema";
import { IUser } from "@/app/models/user.schema";
import { useAuth } from "@/context/auth-context";

interface IProps {
  comments: IClaimComment[];
  onSendMessage: (message: string) => void;
  loading?: boolean;
}

const ClaimChat = ({ comments, onSendMessage, loading }: IProps) => {
  const [newMessage, setNewMessage] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { user } = useAuth();

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    onSendMessage(newMessage);
    setNewMessage("");
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-none border-l">
      <h3 className="border-b p-2 font-semibold">Comments</h3>
      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto bg-primary/20 p-4">
        {comments.length === 0 && (
          <p className="text-center italic text-gray-400 pt-6">No comments yet</p>
        )}

        {comments.map((comment) => {
          const author = comment.author as unknown as IUser;
          const isAuthor = author._id === user?._id;
          return (
            <div
              key={comment.createdAt.toString()}
              className={`flex ${
                isAuthor ? "justify-end" : "justify-start"
              } w-fit max-w-[75%]`}
            >
              <div
                className={`max-w-xs rounded-xl px-4 py-2 text-sm shadow ${
                  isAuthor
                    ? "rounded-br-none bg-primary/75 text-gray-800"
                    : "rounded-bl-none border bg-white text-gray-800"
                }`}
              >
                {!isAuthor && (
                  <small className="mr-6 font-bold">{author.name}</small>
                )}
                <p>{comment.text}</p>
                <small className="block text-right text-gray-600">
                  {dayjs(comment.createdAt).format("HH:mm")}
                </small>
              </div>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 border-t bg-white p-3">
        <input
          type="text"
          aria-label="Comment input"
          className="flex-1 rounded-full border px-4 py-2 focus:outline-none"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <button
          aria-label="Send message"
          className="rounded-full bg-primary px-4 py-2 uppercase text-gray-800 hover:bg-primary/75 disabled:opacity-50"
          onClick={handleSend}
          disabled={loading}
        >
          {loading ? <Spinner size="sm" color="white" /> : "Send"}
        </button>
      </div>
    </div>
  );
};

export default ClaimChat;
