import ChatPreview from "../components/ChatPreview";
import "./css/chats.css";

function Chats() {
  return (
    <div id="parent-div">
      <div id="top-bar">
        <h1> ChatApp </h1>
      </div>
      <div id="chats-area">
        <ChatPreview
          name="John Doe"
          message="Lorem Ipsum"
          time="22:22"
          url="/chats"
        ></ChatPreview>
      </div>
      <div id="bottom-bar"></div>
    </div>
  );
}

export default Chats;
