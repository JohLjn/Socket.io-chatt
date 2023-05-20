<script>
  export default {
    created() {
      this.savedMessages()
    },
    data() {
      return {
        user: null,
        inputUser: '',
        msgDb: null,
        usersHistory: []
      }
    },
    methods: {
      navigateToChat() {
        if (this.usersHistory.includes(this.inputUser)) {
          this.$router.push({
            path: `/chat/1`,
            query: { user: this.inputUser }
          })
        }
      },
      async savedMessages() {
        const data = await fetch('http://localhost:3000/messages')
        this.msgDb = await data.json()
        for (let i = 0; i < this.msgDb.length; i++) {
          const user = this.msgDb[i].user
          if (!this.usersHistory.includes(user)) {
            this.usersHistory.push(user)
          }
        }
      }
    }
  }
</script>

<template>
  <main>

    <div id="user">
      <h1>😎✌</h1>
      <input
        placeholder="Name "
        v-model="inputUser"
        type="text"
        id="inputUser"
      /><button id="login-btn" @click="navigateToChat()">Send</button>
    </div>
  </main>
</template>

<style scoped>
  main {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100vw;
    height: 100vh;
    background-color: rgb(250, 250, 250);
  }
  #user {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 15px;
  }
  #inputUser {
    padding: 5px;
  }

  #login-btn {
    margin-top: 15px;
    padding: 5px 15px;
  }
</style>
