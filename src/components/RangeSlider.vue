<template>
  <div class="vue-range-slider">
    <vue-range-slider v-model="value" :min="min" :max="max" :formatter="formatter" @slide-end='changeValue'></vue-range-slider>
    <small class="control-text">Street Width</small>
  </div>
</template>

<script>
import 'vue-range-component/dist/vue-range-slider.css'
import VueRangeSlider from 'vue-range-component'

export default {

  data() {
    return {
      value: [6, 10]
    }
  },
  components: {
    VueRangeSlider
  },
  created() {
    this.min = 1
    this.max = 30
    this.formatter = value => `${value}m`
  },
  methods: {
    changeValue() {
      // this.$emit('changeValue', this.value);
      this.$store.commit('setRange', this.value)
      this.$store.commit('generatePolygons')
    }
  }
}
</script>

<style>
#vue-range-slider {
  position: absolute;
  width: 200px;
  float: left;
  top: 38px;
  left: 50px;
  z-index: 1;
}
/* #control-text {
  margin-bottom: 100px;
} */
.vue-range-slider.slider-component .slider .slider-process {
  background-color: #06be7f;
}
.vue-range-slider.slider-component .slider-tooltip-wrap .slider-tooltip {
  border: #06be7f;
  background-color: #06be7f;
  font-family: Avenir;
  opacity: 0.8;
}
</style>
