function sliders(el, state) {
    const {dataPoints, views} = state.get()

    makeSlider(dataPoints, dataPoint => state.setState({dataPoint}))
    makeSlider(views, view => state.setState({view}))

    function makeSlider(array, onChange) {
        const base = d3.select(el)
        const root = base.append('div')
                         .attr('class', 'row')
                         .attr('class', 'align-items-center')
        root.append('div')
                         .attr('class', 'col-sm-2')
                         .append('p')
                         .attr('class', 'value-step')
        root.append('div')
                         .attr('class', 'col-sm')
                         .append('div')
                         .attr('class', 'slider-step')

        var sliderStep = d3
            .sliderBottom()
            .min(0)
            .max(array.length - 1)
            .width(300)
            .tickFormat(d => array[d])
            .ticks(array.length - 1)
            .step(1)
            .on('onchange', val => {
                const cur = array[val]
                root.select('p.value-step').text(cur);
                onChange(cur)
            });

        var gStep = root
            .select('div.slider-step')
            .append('svg')
            .attr('width', 500)
            .attr('height', 100)
            .append('g')
            .attr('transform', 'translate(30,30)');

        gStep.call(sliderStep);

        root.select('p.value-step').text(array[sliderStep.value()]);

    }



}
