const width = window.innerWidth;
const height = window.innerHeight;

const dataPoints = ['2019.10.20.19.40.57', '2019.10.22.13.41.53']
const dataTypes = ['municipios', 'pais']
const dataURL = (type, point) => `./data/${type}.${point}.csv`

const elections = {}
const load = Promise.all(dataPoints.map(p => {
    elections[p] = {}

    return Promise.all(dataTypes.map(t =>
        d3.csv(dataURL(t, p))
          .then(data => {
              elections[p][t] = data
          })
    ))
}))

load.then(() => {
    elections[dataPoints[0]].municipios.map(d => map.set(d['Municipio'], d))
})

const projection = d3.geoMercator()
                     .translate([width / 2, height / 2])
                     .scale((width - 1) / 2 / Math.PI);

const path = d3.geoPath()
               .projection(projection);

const div = d3.select('body').append('div')
            .attr('class', 'tooltip')
const map = d3.map()

const zoom = d3.zoom()
               .scaleExtent([1, 16])
               .on('zoom', zoomed);

const svg = d3.select('body').append('svg')
              .attr('width', width)
              .attr('height', height);

const g = svg.append('g')
             .attr('class', 'world')
const b = svg.append('g')
             .attr('class', 'bolivia')

svg.call(zoom);

d3.json('//unpkg.com/world-atlas@1/world/110m.json')
  .then(world => {
      g.append('path')
       .datum({ type: 'Sphere' })
       .attr('class', 'sphere')
       .attr('d', path);

      g.append('path')
       .datum(topojson.merge(world, world.objects.countries.geometries))
       .attr('class', 'land')
       .attr('d', path);

      g.append('path')
       .datum(topojson.mesh(world, world.objects.countries, (a, b) => a !== b))
       .attr('class', 'boundary')
       .attr('d', path);
  });

d3.json('./data/elecciones_2019_municipios_r2.json')
  .then(bolivia => {
      b.selectAll('path')
       .data(topojson.feature(bolivia, bolivia.objects.elecciones_2019_municipios_r2).features)
       .enter().append('path')
       .attr('fill', (d) => {
           const dataPoint = map.get(d.properties.NOM_MUN)
           if (!dataPoint) {
               return 'green'
           }

           const [MAS, CC] = [dataPoint['MAS - IPSP'], dataPoint['CC']]
           const diff = (CC - MAS)/(MAS + CC)

           console.error('d', d, dataPoint, diff)
           // Base county colors on win % per county
           if (diff >= 0.05) return '#f44336'
           if (diff > 0) return '#ef9a9a'
           if (diff >= -0.05) return '#bbdefb'
           return '#2196f3'
       })
       .attr('d', path)
       .on('mouseover', onMouseOver('NOM_MUN', d => ({
           Municipio: d.properties.NOM_MUN,
           resultados: 'niguno'
       })))
  })

function onMouseOver(
    prop, 
    notFound = data => ({
        Pais: data.properties.name,
        resultados: 'no hay datos'
    })) {
    return (data) => {
        d = map.get(data.properties[prop])
        if (!d) {
            d = notFound(data)
        }

        div.transition()
           .duration(200)
           .style('opacity', 0.9)

        div.html(
            Object.keys(d).map(f => `<span><b>${f}:</b> ${d[f]}</span>`).join('')
        )
           .style('left', (d3.event.pageX) + 'px')
           .style('top', (d3.event.pageY - 28) + 'px')
    }
}

function zoomed() {
    svg
        .selectAll('path') // To prevent stroke width from scaling
        .attr('transform', d3.event.transform);
}
