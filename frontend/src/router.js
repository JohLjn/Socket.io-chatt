import { createRouter, createWebHashHistory } from 'vue-router'

import LoginView from './views/LoginView.vue'
import ChatView from './views/ChatView.vue'

export default createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      component: LoginView,
      path: '/'
    },
    {
      component: ChatView,
      path: '/chat/:id'
    }
  ]
})
