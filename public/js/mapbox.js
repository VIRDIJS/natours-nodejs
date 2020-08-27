export const displayMap = (locations) => {
    mapboxgl.accessToken = 'pk.eyJ1IjoiamF0aW5kZXIwMDEiLCJhIjoiY2tlNmFucjk3MWIxYzJ5bXc4eHpmZzAxeiJ9.vyAITUCkKm7g8QUk363aQw';
    var map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/jatinder001/cke6bk5ya12kj19nps6aipquy',
        center:[-118.190165,34.052271],
        zoom:10,
        scrollZoom:false
        // interactive:false
    });
    
    const bounds = new mapboxgl.LngLatBounds();
    
    locations.forEach(loc => {
        // Create marker
        const el = document.createElement('div');
        el.className = 'marker'
    
        // Add marker
        new mapboxgl.Marker({
            element: el,
            anchor:'bottom',
        }).setLngLat(loc.coordinates).addTo(map)
    
        //  Add popup
        new mapboxgl.Popup({
            offset:30
        }).setLngLat(loc.coordinates).setHTML(`<p>${loc.day}: ${loc.description}</p>`).addTo(map)
        // Extend the bounds to include the current location
        bounds.extend(loc.coordinates)
    })
    
    map.fitBounds(bounds,{
        padding:{
            top:200,
            bottom:150,
            left:100,
            right:100
        }
    })
}

