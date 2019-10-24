const views = ['Departamento', 'Municipio', 'País']
const dataPoints = ['2019.10.20.19.40.57', '2019.10.22.13.41.53']
const dataPointsUrl = './data/datapoints.csv'
const dataURL = (type, point) => `./data/${type}/${type}-acta.${point}.xlsx.csv`
const dataTypes = views.reduce((a, c) => Object.assign({}, a, {
    [c]: c.toLowerCase().replace(/í/, 'i')
}), {})


const colors = {
    'CC': "#e96629",
    'MTS': "#6B8D28",
    'MAS - IPSP': "#124eA0",
    'PAN-BOL': "#F817e2",
    'PDC': "#156166",
    '21F': "#E01737",
    'UCS': "#26749B",
    'MNR': "#D8BAD8",
    'FPV': "#aaa",
    'Blancos': "#fff"
}

const elections = {}
const load = d3
    .json(dataPointsUrl)
    .then(dataPoints => {
        Promise.all(dataPoints.map(p => {
            elections[p] = {}

            return Promise.all(Object.values(dataTypes).map(t =>
                d3.csv(dataURL(t, p))
                  .then(data => {
                      elections[p][t] = data
                  })
            ))
        }))
    }

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
        elections,
        dataPoints,
        dataTypes,
        views,
        colors,
        dataPoint: dataPoints[0],
        view: views[0]
    })

    map('#map', state)
    dashboard('#dashboard', state)
    sliders('#sliders', state)
})

