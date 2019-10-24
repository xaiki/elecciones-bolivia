const views = ['Departamento', 'Municipio', 'País']
const dataPointsUrl = './data/datapoints.json'
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

class State extends EventTarget {
    constructor(state, setters = {}) {
        super()
        this.state = {}
        this.setters = setters

        this.setState(state)
    }
    setState(newState) {
        const stateUpdates = Promise.all(
            Object.keys(newState)
                  .filter(k => this.setters[k])
                  .map(s => this.setters[s](newState, this.state)))

        return stateUpdates.then(newStates => {
            this.state = Object.assign.apply(
                this, [{}, this.state, ...newStates, newState])
            this.dispatchEvent(new Event('state:changed'))
        })
    }
    get() {
        return this.state
    }
}

window.State = State

load.then((dataPoints) => {
    const state = new State({
        elections,
        dataPoints,
        dataTypes,
        views,
        colors
    }, {
        dataPoint: ({dataPoint}, state) => {
            console.error('setting state.dataPoint, trigguered an update')
            const elections = state.elections || {}
            if (elections[dataPoint]) return Promise.resolve({})

            elections[dataPoint] = {}
            return Promise.all(Object.values(dataTypes).map(t =>
                d3.csv(dataURL(t, dataPoint))
                  .then(data => {
                      elections[dataPoint][t] = data
                  })
            )).then(() => ({elections}))
        }
    })

    state.setState({
        dataPoint: dataPoints[0],
        view: views[0]
    }).then(() => {
        console.error('state', state)
        map('#map', state)
        dashboard('#dashboard', state)
        sliders('#sliders', state)
    })
})

