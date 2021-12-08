import Vue from 'vue';
import Vuex from 'vuex';
import mapboxgl from "mapbox-gl";
import * as MapboxDraw from 'mapbox-gl-draw';
import { updateDraw } from '../components/Map'
Vue.use(Vuex);


export const store = new Vuex.Store({
  state:{
    accessToken:
      "pk.eyJ1IjoibmljaG9sYXNtYXJ0aW5vIiwiYSI6ImNrMjVhOGphOTAzZGUzbG8wNHJhdTZrMmYifQ.98uDMnGIvn1zrw4ZWUO35g",
    widthRange: [6, 10],
    draw: null,
    mapbox: null,
    polygons: null
  },
  getters: {
    getDraw: state => {
        return state.draw
    }
  },
  mutations: {
    setRange: (state, value) => {
      state.widthRange = value
    },
    setDraw: (state, draw) => {
      state.draw = draw
    },
    loadMap: (state, mapbox) => {
      state.mapbox = mapbox
    },
    generatePolygons: (state, polygons) => {
      console.log(updateDraw(state.mapbox, state.draw, state.widthRange))
      state.polygons = polygons
    }
  },
  actions: {
    loadMap (context) {
      mapboxgl.accessToken = this.state.accessToken
      var mapbox = new mapboxgl.Map({
        container: "map",
        interactive: true,
        style:  "mapbox://styles/mapbox/dark-v10",
        zoom: 16,
        center: [-123.1068658, 49.2626982],
        pitch: 60,
        bearing: 360,
        antialias: true,
        attributionControl: false
      })
      context.commit('loadMap', mapbox)
    },
    setDraw (context) {
      // Add draw controls
      const draw = new MapboxDraw();
      this.state.mapbox.addControl(draw, 'top-right');
      context.commit('setDraw', draw)
    },
  }
})
