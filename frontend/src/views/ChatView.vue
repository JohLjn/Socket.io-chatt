<script>
  import { io } from 'socket.io-client'
  export default {
    created() {
      this.savedMessages()
      this.savedUsers()
      this.user = this.$route.query.user
    },
    data() {
      return {
        typingIndicator: '',
        user: null,
        inputMessage: '',
        socket: null,
        addName: true,
        socketID: null,
        chatUserSend: false,
        chatHistory: [],
        chatUsers: [],
        specificChat: [],
        chatCurrent: [],
        targetMessage: '',
        groupChatActive: false,
        userImage: '',
      }
    },
    methods: {
      async savedMessages() {
        const data = await fetch('http://localhost:3000/messages')
        this.chatHistory = await data.json()
      },
      async savedUsers() {
        const data = await fetch('http://localhost:3000/users')
        this.allUsers = await data.json()

        for (let i = 0; i < this.allUsers.length; i++) {
          const userImage = this.allUsers[i].profileImg
          const user = this.allUsers[i].username
          if (!this.allUsers.includes(user)) {
            this.chatUsers.push(user)
          }
          if (user === this.user) {
            this.userImage = userImage
          }
        }
      },
      sendMessage(e) {
        this.chatUserSend = true
        e.preventDefault()
        if (this.inputMessage) {
          this.socket.emit('chatMessage', {
            user: this.user,
            message: this.inputMessage,
            reciever: this.targetMessage,
            profileImg: this.userImage
          })
          this.inputMessage = ''
        }
      },
      newChatMessage(msg) {
        console.log(msg)
        this.chatCurrent.push({
          message: msg.message.message,
          user: msg.message.user,
          date: msg.dateTime,
          profileImg: msg.message.profileImg,
          reciever: msg.message.reciever
        })
        this.typingIndicator = ''
      },
      async targetUserHistory(username) {
        this.groupChatActive = false
        this.targetMessage = username
        this.chatCurrent = []
        this.specificChat = []
        const data = await fetch('http://localhost:3000/messages')
        this.chatHistory = await data.json()
        for (let i = 0; i < this.chatHistory.length; i++) {
          const msg = this.chatHistory[i]
          if (
            this.chatHistory[i].user === username &&
            this.chatHistory[i].reciever === this.user
          ) {
            this.specificChat.push(msg)
          } else if (
            this.chatHistory[i].user === this.user &&
            this.chatHistory[i].reciever === username
          ) {
            this.specificChat.push(msg)
          }
        }
        //Fetch profileImages
        const dataUsers = await fetch('http://localhost:3000/users')
        const users = await dataUsers.json()

        for (let i = 0; i < this.specificChat.length; i++) {
          const chatUser = this.specificChat[i].user
          for (let j = 0; j < users.length; j++) {
            if (users[j].username === chatUser) {
              this.specificChat[i].profileImg = users[j].profileImg
            }
          }
        }
      },
      async targetGroupChat() {
        this.groupChatActive = true
        this.targetMessage = 'group'
        this.chatCurrent = []
        this.specificChat = []

        const data = await fetch('http://localhost:3000/messages')
        this.chatHistory = await data.json()

        for (let i = 0; i < this.chatHistory.length; i++) {
          const msg = this.chatHistory[i]
          if (msg.reciever === this.targetMessage) {
            this.specificChat.push(msg)
          }
        }

        //Fetch profileImages
        const dataUsers = await fetch('http://localhost:3000/users')
        const users = await dataUsers.json()

        for (let i = 0; i < this.specificChat.length; i++) {
          const chatUser = this.specificChat[i].user
          for (let j = 0; j < users.length; j++) {
            if (users[j].username === chatUser) {
              this.specificChat[i].profileImg = users[j].profileImg
            }
          }
        }
      },

      isTargetMessage(chat) {
        return (
          (chat.user === this.user && chat.reciever === this.targetMessage) ||
          (chat.user === this.targetMessage && chat.reciever === this.user)
        )
      },
      logout() {
        localStorage.removeItem('loggedIn')
        this.$router.push('/')
      }
    },
    computed: {
      filteredUsers() {
        return this.chatUsers.filter((user) => user !== this.user)
      }
    },

    watch: {
      inputMessage: {
        handler() {
          if (this.inputMessage) {
            this.socket.emit('typing', { user: this.user })
          } else if (!this.inputMessage) {
            this.socket.emit('notTyping', { user: this.user })
          }
        },
        immediate: false,
        deep: true
      }
    },

    mounted() {
      this.socket = io('http://localhost:3000', {
        transports: ['websocket']
      })
      this.socket.on('connect', () => {
        console.log('Socket connected!')
        this.socketID = this.socket.id
      })
      this.socket.on('newChatMessage', this.newChatMessage)
      this.socket.on('chatUser', this.chatUser)

      this.socket.on('userTyping', ({ username }) => {
        this.typingIndicator = `${username.user} is typing...`
      })

      this.socket.on('userNotTyping', () => {
        this.typingIndicator = ''
      })
    }
  }
</script>

<template>
  <!-- Header -->
  <div class="user-selection-container">
    <div @click="logout()" class="users-collection">
      <div id="logout-box" class="user-box">Logout</div>
    </div>
    <div
      class="users-collection"
      v-for="cUser in filteredUsers"
      :key="cUser._id"
      @click="targetUserHistory(cUser)"
    >
      <div class="user-box">
        {{ cUser }}
      </div>
    </div>
    <div
      style="margin-left: auto; width: 15%;"
      class="users-collection"
      @click="targetGroupChat()"
    >
      <div class="user-box">Groupchat</div>
    </div>
  </div>
  <!-- MongoDB -->
  <div class="chatbox-container">
    <ul class="messages-mongo">
      <div
        class="justifty-cont-container"
        v-for="chat in specificChat"
        :key="chat._id"
        :id="chat.user !== user ? 'justify-cont-user' : ''"
      >
        <div style="width: 100%">
          <p :id="chat.user === user ? 'mongo-user-host' : 'mongo-user'">
            {{ chat.user }} {{ chat.date }}
          </p>
          <li
            :id="chat.user === user ? 'mongo-messages' : 'mongo-messages-guest'"
          >
            {{ chat.message }}
          </li>
        </div>
        <img class="user-profile-pic" :src="chat.profileImg" alt="send" />
      </div>
    </ul>

    <!-- Socket.io -->
    <ul class="messages-mongo" v-for="chat in chatCurrent" :key="chat._Id">
      <div
        class="justifty-cont-container"
        v-if="isTargetMessage(chat) && !groupChatActive"
        :id="chat.user !== user ? 'justify-cont-user' : ''"
      >
        <div style="width: 100%">
          <p :id="chat.user === user ? 'mongo-user-host' : 'mongo-user'">
            {{ chat.user }} {{ chat.date }}
          </p>
          <li :id="chat.user === user ? 'user-add' : 'user-recieve'">
            {{ chat.message }}
          </li>
        </div>
        <img class="user-profile-pic" :src="chat.profileImg" alt="send" />
      </div>
    </ul>

    <!-- Socket.io Groupchat-->
    <ul class="messages-mongo" v-for="chat in chatCurrent" :key="chat._Id">
      <div
        class="justifty-cont-container"
        v-if="groupChatActive"
        :id="chat.user !== user ? 'justify-cont-user' : ''"
      >
        <div style="width: 100%">
          <p :id="chat.user === user ? 'mongo-user-host' : 'mongo-user'">
            {{ chat.user }} {{ chat.date }}
          </p>
          <li :id="chat.user === user ? 'user-add' : 'user-recieve'">
            {{ chat.message }}
          </li>
        </div>
        <img class="user-profile-pic" :src="chat.profileImg" alt="send" />
      </div>
    </ul>
    <!-- Input-field -->
    <li
      style="margin-left: 10px; margin-top: 10px;"
      v-if="typingIndicator && groupChatActive"
      class="typing-indicator"
    >
      {{ typingIndicator }}
    </li>
    <div id="message" class="input-message-container" v-if="targetMessage">
      <form id="formMessage">
        <input
          placeholder="Message"
          v-model="inputMessage"
          @keyup.enter="sendMessage"
          type="text"
          id="inputMessage"
        />
        <div class="send-msg-container">
          <img
            id="sendTextBtn"
            @click="sendMessage"
            src="/assets/send-4008.svg"
            alt="send"
          />
        </div>
      </form>
    </div>
    <!-- Intro text -->
    <div class="intro-container-text" v-else>
      <h2>Hej {{ user }}!</h2>
      <p>
        Webbplatsen som byggs med den tillhandahållna koden är en
        chattapplikation som möjliggör kommunikation i realtid mellan användare.
        Syftet med webbplatsen är att underlätta omedelbar meddelandehantering
        mellan användare via ett webbgränssnitt. Sammanfattningsvis erbjuder
        webbplatsen en plattform för användare att logga in, välja andra
        användare att chatta med, visa chattens historia från MongoDB samt
        skicka och ta emot meddelanden i realtid med hjälp av Socket.io. Syftet
        är att skapa en sömlös och interaktiv chattupplevelse för användare som
        interagerar via webbgränssnittet.
      </p>
      <br />
      <p>
        Detta är ursprungligen ett labb-projekt för en backend-kurs där syftet
        och målet var att bekanta sig med hur Socket.io är uppbyggt och
        strukturerat.
      </p>
      <p style="text-align: right; opacity: 0.6; margin-top: 8px">20/05-2023</p>
    </div>
  </div>
</template>

<style scoped>
  .user-selection-container {
    display: flex;
    width: 80%;
    margin: 30px auto 0px auto;
  }

  .users-collection {
    width: 10%;
    padding: 10px 0px;
    box-shadow: 0px -0.5px 2px rgb(182, 181, 181);
    display: flex;
    justify-content: center;
  }

  #logout-box {
    text-decoration: underline;
    color: orange;
  }

  .chatbox-container {
    display: flex;
    flex-direction: column;
    box-shadow: 0px 0px 3px black;
    width: 80%;
    margin: 0px auto 40px auto;
  }

  .users-collection:hover {
    background-color: rgb(233, 233, 233);
    cursor: pointer;
  }

  #messages {
    display: flex;
    flex-direction: column;
    padding: 20px;
    padding-top: 0px;
    border-radius: 10px;
  }

  .messages-mongo {
    display: flex;
    flex-direction: column;
    padding: 0px 5px 20px 5px;
    padding-bottom: 0px;
    border-radius: 10px;
  }

  .justifty-cont-container {
    display: flex;
    justify-content: space-between;
  }

  #justify-cont-user {
    flex-direction: row-reverse;
  }

  .user-profile-pic {
    width: 46px;
    height: 46px;
    align-self: center;
    margin: 10px 10px 0px 10px;
    border-radius: 50%;
  }

  body {
    font-family: Arial, Helvetica, sans-serif;
  }
  p {
    font-size: 20px;
    line-height: 130%;
    padding: 0;
    margin: 0;
  }
  h1 {
    font-family: Georgia, Arial, Helvetica, sans-serif;
    color: #930;
    margin: 0px;
    margin-bottom: 12px;
  }
  h2 {
    margin: 0px;
    margin-bottom: 8px;
  }
  ul {
    margin: 0;
    padding: 0;
    list-style-type: none;
  }
  li {
    margin: 0;
    padding: 0;
    list-style-type: none;
    margin-bottom: 5px;
  }
  a {
    font-size: 16px;
    color: #f90;
    text-decoration: none;
  }
  a:hover {
    text-decoration: underline;
  }

  #mongo-user,
  #mongo-user-host {
    margin: 0px;
    margin-top: 10px;
    font-size: 0.9rem;
    opacity: 0.6;
  }

  #mongo-user-host {
    text-align: right;
  }

  #mongo-messages {
    width: 75%;
    background-color: #08d48d;
    margin-left: auto;
    padding: 10px;
    color: white;
    border-radius: 8px;
    font-size: 1rem;
  }

  #mongo-messages-guest {
    background-color: #f4f4f4;
    color: black;
    width: 75%;
    padding: 10px;
    border-radius: 8px;
    font-size: 1rem;
  }

  .input-message-container {
    border-top: 1px solid rgb(192, 190, 190);
    display: flex;
    justify-content: center;
    margin-top: 10px;
  }

  #inputMessage {
    width: 87.5%;
    border: none;
    padding: 15px 10px;
    border-right: 1px solid rgb(192, 190, 190);
  }

  #formMessage {
    width: 100%;
    display: flex;
  }

  .send-msg-container {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 12.5%;
  }

  #sendTextBtn:hover {
    cursor: pointer;
    opacity: 0.7;
  }

  #user-add {
    width: 75%;
    background-color: #08d48d;
    margin-left: auto;
    padding: 10px;
    color: white;
    border-radius: 8px;
    font-size: 1rem;
  }
  #user-recieve {
    background-color: #f4f4f4;
    width: 75%;
    padding: 10px;
    border-radius: 8px;
    font-size: 1rem;
    color: black;
  }
  .intro-container-text {
    padding: 15px;
  }

  .intro-container-text p {
    font-size: 1rem;
  }
</style>
