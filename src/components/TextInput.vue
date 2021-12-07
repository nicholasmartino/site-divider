<template>
  <div class="filter-ctrl">
    <input id="filter-input" type="text" name="filter" placeholder="Iterations">
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
  top: 10px;
  left: 10px;
  z-index: 1;
}

.filter-ctrl input[type='text'] {
  font: 12px/20px 'Helvetica Neue', Arial, Helvetica, sans-serif;
  width: 100%;
  border: 0;
  background-color: #fff;
  margin: 0;
  color: rgba(0, 0, 0, 0.5);
  padding: 10px;
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
  border-radius: 3px;
  width: 180px;
}
</style>
