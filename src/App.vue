<template>
  <div> 
    <div id="control-box"></div>
    <div id="app">
      <Map />
    </div>

    <!-- <div id="text_input">
      <TextInput />
    </div> -->
    <div id="tab">
      <TabNav :tabs="['Home', 'Settings', 'Profile']" :selected="selected" @selected="setSelected">
        <Tab :isSelected="selected === 'Home'">
          <div class="container">
            <div class="row">
              <p></p>
              <p></p>
            </div>

            <div class="row">
              <div class="col-sm">
                <div id="area_box">
                  <p>PID</p>
                  <p>Description</p>
                  <p>Zone</p>
                  <p>Built</p>
                </div>
              </div>
              <div class="col-sm">
                <div id="pid"></div>
                <div id="freeform"></div>
                <div id="zone"></div>
                <div id="built-area"></div>
              </div>
            </div>

            <div class="row">
              <div class="col-sm">
                  <p>Area</p>
                  <p>Perimeter</p>
              </div>
              <div class="col-sm">
                <div id="calculated-area"></div>
                <div id="calculated-perimeter"></div>
              </div>
            </div>

          </div>
        </Tab>

        <Tab :isSelected="selected === 'Settings'">
          <p>Settings tabs</p>
        </Tab>

        <Tab :isSelected="selected === 'Profile'">
          <ul>
            <li>List test 1</li>
            <li>List test 2</li>
            <li>List test 3</li>
          </ul>
        </Tab>
      </TabNav>
    </div>
  </div>
</template>

<script>
import Map from "./components/Map"
// import AreaBox from "./components/AreaBox"
// import TextInput from "./components/TextInput"
import TabNav from "./components/TabNav"
import Tab from "./components/Tab"

export default {
  name: "App",
  components: {
    Map,
    TabNav,
    Tab,
    // AreaBox,
    // TextInput,
  },
  data() {
    return {
      selected: 'Home'
    };
  },
  methods: {
    setSelected(tab) {
      this.selected = tab;
    },
  }
}
</script>

<style>
@import 'https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css';

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

/* #control-box {
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
} */

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

#nav {
  position: absolute;
  float: left;
  top: 5px;
  left: 5px;
}

#tab {
  position: absolute;
  float: left;
  top: 5px;
  left: 5px;
}
</style>
