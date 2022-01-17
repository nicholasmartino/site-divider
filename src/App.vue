<template>
  <div> 
    <div id="control-box"></div>
    <div id="app">
      <Map />
    </div>
    <div id="area_box">
      <AreaBox />
    </div>
    <!-- <div id="text_input">
      <TextInput />
    </div> -->
  </div>
</template>

<script>
import Map from "./components/Map";
import AreaBox from "./components/AreaBox";
// import TextInput from "./components/TextInput";

export default {
  name: "App",
  components: {
    Map,
    AreaBox,
    // TextInput,
  },
};
</script>

<style>

body,
html {
  width: 100%;
  height: 100%;
  margin: 0;
}

#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin: 0;
  padding: 0;
  width: 100vw;
  height: 100vh;
}

#control-box {
  position: absolute;
  float: left;
  top: 5px;
  left: 5px;
  width: 250px;
  z-index: 1;
  height: 75px;
  background: white;
  background-color: white;
  border-radius: 5px;
  opacity: 0.8
}

/* #vue-range-slider {
  position: absolute;
  width: 200px;
  float: left;
  top: 100px;
  left: 10px;
  z-index: 1;
} */

.navbar {
  margin-top: 1rem;
  margin-bottom: 1rem;
  border-radius: 0.25rem;
}
</style>
