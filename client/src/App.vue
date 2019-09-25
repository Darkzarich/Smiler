<template>
  <div id="app">
    <header-element/>
      <!-- <div id="nav">
        <router-link to="/">Home</router-link> |
        <router-link to="/about">About</router-link>
      </div> -->
    <div class="content-box">
      <content class="content-box__main">
        <router-view/>
      </content>
      <div class="content-box__sidebar">
        111
      </div>
    </div>
  </div>
</template>

<script>
import HeaderElement from '@/components/HeaderElement'
import api from '@/api'

export default {
  components: {
    HeaderElement,
  },
}
</script>

<style lang="scss">
@import '@/styles/variables.scss';
@import '@/styles/colors.scss';

html {
  font-family: "Roboto","Open Sans",Helvetica,Arial,sans-serif,
}

body {
  margin: 0;
  background: $bg;
}

#app {
  min-height: 100vh;
}

.content-box {
  margin-top: $header-height-interval;
  max-width: 1110px;
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  padding-left: 80px;
  padding-right: 10px;
  &__main {
    width: 70%;
    margin-right: $widget-margin;
  }
  &__sidebar {
    width: 30%;
    border: 1px solid $light-gray;
    background: $widget-bg;
    border-radius: 2px;
  }
}

// #app {
//   font-family: 'Avenir', Helvetica, Arial, sans-serif;
//   -webkit-font-smoothing: antialiased;
//   -moz-osx-font-smoothing: grayscale;
//   text-align: center;
//   color: #2c3e50;
// }
// #nav {
//   padding: 30px;
//   a {
//     font-weight: bold;
//     color: #2c3e50;
//     &.router-link-exact-active {
//       color: #42b983;
//     }
//   }
// }
</style>
