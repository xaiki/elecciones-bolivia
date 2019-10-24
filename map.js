function map(el, state) {
    const width = window.innerWidth;
    const height = window.innerHeight;

    const normalize = d => (d || '').toLowerCase().replace(/í/, 'i')

    const projection = d3.geoMercator()
                         .translate([width / 2, height / 2])
                         .scale((width - 1) / 2 / Math.PI);

    const path = d3.geoPath()
                   .projection(projection);

    const div = d3.select('body').append('div')
                  .attr('class', 'tooltip')
    const map = d3.map()

    const zoom = d3.zoom()
                   .scaleExtent([0, 16])
                   .on('zoom', zoomed);

    const svg = d3.select(el).append('svg')
                  .attr('width', width)
                  .attr('height', height);

    const g = svg.append('g')
                 .attr('class', 'world')
    const b = svg.append('g')
                 .attr('class', 'bolivia')

    svg.call(zoom);

    const {elections, dataTypes, colors} = state.get()
    const partidos = Object.keys(colors)
    const processData = (propName) => (d) => {
        const key = normalize(d.properties[propName])
        const dataPoint = map.get(key) 
        if (!dataPoint) {
            return 'green'
        }
        const sorted = partidos.map(p => ({
            name: p,
            votes: parseInt(dataPoint[p])
        })).sort((a, b) => a.votes > b.votes ? -1 : 1)
        const [first, second] = [sorted[0].votes, sorted[1].votes]
        const diff = (first - second)/(first + second)

        const color = d3.color(colors[sorted[0].name])
        return color.darker(diff) + ""
    }

    const loadMundo = () =>
        d3.json('./data/mundo.topo.json')
          .then(world => {
              console.error('world', world)
              g.append('path')
                     .datum({ type: 'Sphere' })
                     .attr('class', 'sphere')
                     .attr('d', path);

              g.append('path')
               .datum(topojson.merge(world, world.objects.mundo.geometries))
               .attr('class', 'land')
               .attr('d', path);
          })

    const loadDepartamentos = () =>
        d3.json('./data/departamentos-quant.topo.json')
          .then(bolivia => {
              b.selectAll('path.departamento')
               .data(topojson.feature(bolivia, bolivia.objects.departamentos).features)
               .enter().append('path')
               .attr('class', 'departamento')
               .attr('d', path)
          })

    const loadMunicipios = () =>
        d3.json('./data/municipios-quant.topo.json')
          .then(bolivia => {
              b.selectAll('path.municipio')
               .data(topojson.feature(bolivia, bolivia.objects.municipios).features)
               .enter().append('path')
               .attr('class', 'municipio')
               .attr('d', path)
          })

    function handleState(e) {
        let {dataPoint, view} = state.get()

        console.error('view', view, map)
        elections[dataPoint][dataTypes[view]].map(d =>
            map.set(normalize(d[view]), d))
        render(view)
    }

    Promise.all([loadMundo(), loadDepartamentos(), loadMunicipios()])
           .then(handleState)
    state.addEventListener('state:changed', handleState);


    function render(view) {
        const propName = view === 'Departamento' ? 'NOM_DEP':'NOM_MUN'
        const selector = view.toLowerCase()
        b.selectAll('path')
         .attr('fill', 'transparent')
         .attr('stroke-opacity', 0.2)
         .on('mouseover', () => {})

        b.selectAll(`path.${selector}`)
         .attr('fill', processData(propName))
         .attr('stroke-opacity', 1)
         .attr('d', path)
    }

    function onMouseOver(
        prop, 
        notFound = data => ({
            Pais: data.properties.name,
            resultados: 'no hay datos'
        })) {
        return (data) => {
            const key = normalize(data.properties[prop])
            d = map.get(key)
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
}
