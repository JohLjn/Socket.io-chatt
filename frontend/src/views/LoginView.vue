<script>
  const beforeEnter = (to, from, next) => {
    if (!localStorage.getItem('loggedIn')) {
      next('/')
    } else {
      next()
    }
  }

  export default {
    created() {
      this.usersDb()
    },
    data() {
      return {
        user: null,
        inputUser: '',
        inputUserPassword: '',
        users: null,
        usersHistory: [],
        failedInput: false
      }
    },
    methods: {
      submitForm() {
        if (
          this.inputUser.trim() === '' ||
          this.inputUserPassword.trim() === ''
        ) {
          this.failedInput = true
        } else {
          this.navigateToChat()
        }
      },
      navigateToChat() {
        const matchedUser = this.users.find(
          (user) =>
            user.username === this.inputUser &&
            user.password === this.inputUserPassword
        )
        if (matchedUser) {
          this.failedInput = false
          localStorage.setItem('loggedIn', 'true')
          this.$router.push({
            path: `/chat/`,
            query: { user: this.inputUser }
          })
        } else {
          this.failedInput = true
        }
      },
      async usersDb() {
        const data = await fetch('http://localhost:3000/users')
        this.users = await data.json()
        for (let i = 0; i < this.users.length; i++) {
          const user = this.users[i].username
          if (!this.usersHistory.includes(user)) {
            this.usersHistory.push(user)
          }
        }
      }
    }
  }

  // Register the guard outside the component options
  export { beforeEnter }
</script>

<template>
  <main>
    <div id="user">
      <h1>😎✌</h1>
      <input
        placeholder="Name "
        v-model="inputUser"
        :class="{ 'invalid-input': failedInput }"
        type="text"
        id="inputUser"
        @keyup.enter="submitForm"
      />
      <input
        placeholder="Password "
        v-model="inputUserPassword"
        :class="{ 'invalid-input': failedInput }"
        type="password"
        id="inputUserPassword"
        @keyup.enter="submitForm"
      />
      <p style="margin-bottom: 0px" v-if="failedInput">😡</p>
      <button id="login-btn" @click="navigateToChat()">Send</button>
    </div>
  </main>
</template>

<style scoped>
  .invalid-input {
    border-color: rgb(241, 12, 12);
  }
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
  #inputUser,
  #inputUserPassword {
    padding: 5px;
  }

  #inputUserPassword {
    margin-top: 15px;
  }

  #login-btn {
    margin-top: 15px;
    padding: 5px 15px;
  }
</style>
