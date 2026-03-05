import { Box } from "@mui/system";
import { Colors, Fonts } from "../theme";
import PopoverMenu from "./PopoverMenu";
import styled from "@emotion/styled";
import { useState, useRef, useEffect } from "react";
import { InputBase, IconButton } from "@mui/material";

interface Props {
  open: boolean;
  anchorEl: HTMLElement | null;
  handleClose: () => void;
}

interface Message {
  id: number;
  text: string;
  sender: "user" | "ai";
}

const TitleAiMenu = styled("p")({
  margin: 0,
  fontFamily: Fonts.main,
  fontSize: "18px",
  fontWeight: "600",
  lineHeight: 1.56,
  color: Colors.lightBlack,
  textAlign: "left",
  borderBottom: `1px solid ${Colors.silverGrey}`,
  paddingBottom: "8px",
  width: "100%",
  flexShrink: 0,
});

const MessageBubble = styled(Box)<{ isUser: boolean }>(({ isUser }) => ({
  maxWidth: "80%",
  padding: "8px 12px",
  borderRadius: isUser ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
  backgroundColor: isUser ? Colors.main : Colors.offWhite,
  color: isUser ? Colors.white : Colors.lightBlack,
  fontFamily: Fonts.main,
  fontSize: "13px",
  lineHeight: 1.5,
  alignSelf: isUser ? "flex-end" : "flex-start",
}));

const AiMenu = ({ anchorEl, open, handleClose }: Props) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), text: input.trim(), sender: "user" },
    ]);
    setInput("");
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <PopoverMenu
      anchorEl={anchorEl}
      open={open}
      setAnchorEl={handleClose}
      height="350px"
    >
      <Box
        sx={{
          height: "350px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <TitleAiMenu>Ai assistant</TitleAiMenu>

        <Box
          sx={{
            position: "relative",
            flex: 1,
            overflow: "hidden",
            borderRadius: "8px",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              pointerEvents: "none",
              opacity: 0.09,
              filter: "grayscale(30%)",
            }}
          >
            <img style={{ height: "72px" }} src="../assets/ai.svg" alt="" />
          </Box>

          <Box
            sx={{
              height: "100%",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              pr: "4px",
              "&::-webkit-scrollbar": { width: "4px" },
              "&::-webkit-scrollbar-track": { background: "transparent" },
              "&::-webkit-scrollbar-thumb": {
                background: Colors.paleGray,
                borderRadius: "4px",
              },
            }}
          >
            {messages.map((msg) => (
              <MessageBubble key={msg.id} isUser={msg.sender === "user"}>
                {msg.text}
              </MessageBubble>
            ))}
            <div ref={messagesEndRef} />
          </Box>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            border: `1px solid ${Colors.paleGray}`,
            borderRadius: "12px",
            px: "12px",
            py: "6px",
            backgroundColor: Colors.ghostWhite,
            flexShrink: 0,
          }}
        >
          <InputBase
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask something..."
            fullWidth
            sx={{
              fontFamily: Fonts.main,
              fontSize: "13px",
              color: Colors.lightBlack,
              "& input::placeholder": { color: Colors.paleSilver },
            }}
          />
          <IconButton
            size="small"
            onClick={handleSend}
            disabled={!input.trim()}
            sx={{ p: "4px", opacity: input.trim() ? 1 : 0.3 }}
          >
            <img
              src="../assets/arrow-narrow-right.svg"
              alt="send"
              style={{ height: "18px" }}
            />
          </IconButton>
        </Box>
      </Box>
    </PopoverMenu>
  );
};

export default AiMenu;
