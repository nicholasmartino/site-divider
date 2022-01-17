<template>
  <div class="filter-ctrl">
    <input id="filter-input" type="text" name="filter" placeholder="3" class="filter-ctrl">
    <small class="control-text">Iterations</small>
  </div>
</template>

<script>

export default {
  name: "TextInput",
  data() {
    return {

    }
  },
  mounted() {
    const filterInput = document.getElementById('filter-input');

    filterInput.addEventListener('keyup', (e) => {
      // // If the input value matches a layerID set
      // // it's visibility to 'visible' or else hide it.
      // const value = e.target.value.trim().toLowerCase();
      // for (const layerID of layerIDs) {
      //   map.setLayoutProperty(
      //     layerID,
      //     'visibility',
      //     layerID.includes(value) ? 'visible' : 'none'
      //   );
      // }
      console.log(e)
    });
  }
}

</script>


<style>
.filter-ctrl {
  position: absolute;
  top: 20px;
  left: 40px;
  z-index: 1;
  border-radius: 5px;
  height: 27px;
  width: 60px;
  border: 0;
  text-align: 'center';
  background-color: 'transparent'
}

/* .filter-ctrl input[type='text'] {
  position: absolute;
  top: 10px;
  left: 10px;
  font: 12px/20px 'Avenir', Arial, Helvetica, sans-serif;
  width: 100%;
  border: 0;
  background-color: #fff;
  margin: 0;
  color: rgba(0, 0, 0, 0.5);
  padding: 10px;
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
  border-radius: 15px;
  width: 180px;
}

.filter-input {
  position: absolute;
  top: 10px;
  left: 10px;
  width: 100%;
  border: 0;
  background-color: #fff;
  margin: 0;
  color: rgba(0, 0, 0, 0.5);
  padding: 10px;
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
  border-radius: 30px;
  width: 180px;
} */
</style>
