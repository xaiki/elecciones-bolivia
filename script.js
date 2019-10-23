const dataPoints = ['2019.10.20.19.40.57', '2019.10.22.13.41.53']
const dataTypes = ['municipios', 'departamento', 'pais']
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

class State extends EventTarget {
    constructor(state) {
        super()
        this.state = state
    }
    setState(newState) {
        this.state = Object.assign({}, this.state, newState)
        this.dispatchEvent(new Event('state:changed'))
    }
    get() {
        return this.state
    }
}

window.State = State

load.then(() => {
    const state = new State({
        dataPoint: '2019.10.20.19.40.57',
        elections: elections
    })


    var sliderStep = d3
        .sliderBottom()
        .min(0)
        .max(dataPoints.length - 1)
        .width(300)
        .tickFormat(d => dataPoints[d])
        .ticks(dataPoints.length - 1)
        .step(1)
        .on('onchange', val => {
            const dataPoint = dataPoints[val]
            d3.select('p#value-step').text(dataPoint);
            state.setState({dataPoint})
        });

    var gStep = d3
        .select('div#slider-step')
        .append('svg')
        .attr('width', 500)
        .attr('height', 100)
        .append('g')
        .attr('transform', 'translate(30,30)');

    gStep.call(sliderStep);

    d3.select('p#value-step').text(dataPoints[sliderStep.value()]);

    map('#map', state)
    dashboard('#dashboard', state)
})

