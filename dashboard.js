function dashboard(id, parentState) {
    let dataName
    const {elections, colors} = parentState.get()
    const fields = Object.keys(colors)

    const state = new State({
        region: null,
        party: null
    })

    const histogram = HistoGram(state)
    const piechart = PieChart(state)
    const legend = Legend(state)


    state.addEventListener('state:changed', handleState);
    function handleState() {
        const {party, region, color, fData} = state.get()

        if (!fData) return // still loading

        console.error(party, region, color)
        if (party) {
            const data = fData.map(d => [d[dataName], d[party]])
            histogram.update(data, color)
        } else if (region) {
            const data = fData.filter(s => s[dataName] === region)[0]
            freq = fields.map(s => ({type: s, freq: data[s]}))

            piechart.update(freq)
            legend.update(freq)
        } else {
            const data = fData.map(d => [d[dataName],d['Votos Válidos']])
            const freq = fields.map(d => ({
                type: d,
                freq: d3.sum(fData.map(t => t[d]))
            }))
            console.error(data, freq)
            histogram.update(data, color)
            piechart.update(freq)
            legend.update(freq)
        }
    }

    function handleParentState(e) {
        const {dataTypes, dataPoint, view} = parentState.get()
        dataName = view
        const fData = elections[dataPoint][dataTypes[view]]
        console.error(elections, dataPoint, view)

        state.setState({fData})
    }

    parentState.addEventListener('state:changed', handleParentState);
    parentState.setState({
        dashboard: state
    })

    var barColor = 'steelblue';
    function segColor(c) {
        return colors[c]
    }

    // function to handle histogram.
    function HistoGram(state, data = []){
        var hG={},    hGDim = {t: 60, r: 0, b: 30, l: 0};
        hGDim.w = 500 - hGDim.l - hGDim.r, 
            hGDim.h = 300 - hGDim.t - hGDim.b;

        //create svg for histogram.
        var hGsvg = d3.select(id).append("svg")
                      .attr("width", hGDim.w + hGDim.l + hGDim.r)
                      .attr("height", hGDim.h + hGDim.t + hGDim.b).append("g")
                      .attr("transform", "translate(" + hGDim.l + "," + hGDim.t + ")");
        const x = d3.scaleBand().rangeRound([0, hGDim.w]).padding(0.1)
        const y = d3.scaleLinear().range([hGDim.h, 0])
        function init(data) {
            console.log('init with', data)
            // create function for x-axis mapping.
            x.domain(data.map(d => d[0]));

            // Add x-axis to the histogram svg.
            hGsvg.append("g").attr("class", "x axis")
                 .attr("transform", "translate(0," + hGDim.h + ")")
                 .call(d3.axisBottom(x));

            y.domain([0, d3.max(data, d => parseInt(d[1]))]);

            // Create bars for histogram to contain rectangles and freq labels.
            const bars = hGsvg.selectAll(".bar").data(data).enter()
                              .append("g").attr("class", "bar");

            //create the rectangles.
            bars.append("rect")
                .attr("x", d => x(d[0]))
                .attr("y", d => y(d[1]))
                .attr("width", x.bandwidth())
                .attr("height", d => hGDim.h - y(d[1]))
                .attr('fill', barColor)
                .on("mouseover",mouseover)// mouseover is defined below.
                .on("mouseout",mouseout);// mouseout is defined below.

            //Create the frequency labels above the rectangles.
            bars.append("text").text(function(d){ return d3.format(",")(d[1])})
                .attr("x", function(d) { return x(d[0])+x.bandwidth()/2; })
                .attr("y", function(d) { return y(d[1])-5; })
                .attr("text-anchor", "middle");

            function mouseover(d){  // utility function to be called on mouseover.
                state.setState({region: d[0], party: null})
            }

            function mouseout(d){    // utility function to be called on mouseout.
                state.setState({region: null, party: null})
            }
            hG.update = hG._update
        }

        hG.update = init

        // create function to update the bars. This will be used by pie-chart.
        hG._update = function(nD, color){
            // update the domain of the y-axis map to reflect change in frequencies.
            y.domain([0, d3.max(nD, d => parseInt(d[1]))]);

            // Attach the new data to the bars.
            var bars = hGsvg.selectAll(".bar").data(nD);

            // transition the height and color of rectangles.
            bars.select("rect").transition().duration(500)
                .attr("y", d => y(d[1]))
                .attr("height", d => hGDim.h - y(d[1]))
                .attr("fill", color);

            // transition the frequency labels location and change value.
            bars.select("text").transition().duration(500)
                .text(d => d3.format(",")(d[1]))
                .attr("y", d => y(d[1]) - 5);            
        }        
        return hG;
    }

    // function to handle pieChart.
    function PieChart(state, data = []){
        var pC ={},    pieDim ={w:250, h: 250};
        pieDim.r = Math.min(pieDim.w, pieDim.h) / 2;

        // create svg for pie chart.
        var piesvg = d3.select(id).append("svg")
                       .attr("width", pieDim.w).attr("height", pieDim.h).append("g")
                       .attr("transform", "translate("+pieDim.w/2+","+pieDim.h/2+")");

        // create function to draw the arcs of the pie slices.
        var arc = d3.arc().outerRadius(pieDim.r - 10).innerRadius(0);

        // create a function to compute the pie slice angles.
        var pie = d3.pie().sort(null).value(function(d) { return d.freq; });

        const update = function(nD){
            piesvg.selectAll("path").data(pie(nD)).transition().duration(500)
                  .attrTween("d", arcTween);
        } 
        function init(data) {
            // Draw the pie slices.
            piesvg.selectAll("path").data(pie(data)).enter().append("path").attr("d", arc)
                  .each(function(d) { this._current = d; })
                  .style("fill", function(d) { return segColor(d.data.type); })
                  .on("mouseover",mouseover).on("mouseout",mouseout);
            pC.update = update
        }
        pC.update = init

        // Utility function to be called on mouseover a pie slice.
        function mouseover(d){
            state.setState({
                party: d.data.type,
                region: null,
                color: segColor(d.data.type)
            })
        }
        //Utility function to be called on mouseout a pie slice.
        function mouseout(d){
            state.setState({region: null, party: null, color: barColor})
        }
        // Animating the pie-slice requiring a custom function which specifies
        // how the intermediate paths should be drawn.
        function arcTween(a) {
            var i = d3.interpolate(this._current, a);
            this._current = i(0);
            return function(t) { return arc(i(t));    };
        }    
        return pC;
    }

    // function to handle legend.
    function Legend(lD = []){
        var leg = {};

        // create table for legend.
        var legend = d3.select(id).append("table").attr('class','legend');

            // create one row per segment.
            var tr = legend.append("tbody").selectAll("tr").data(lD).enter().append("tr");

        // create the first column for each segment.
        tr.append("td").append("svg").attr("width", '16').attr("height", '16').append("rect")
          .attr("width", '16').attr("height", '16')
	  .attr("fill",function(d){ return segColor(d.type); });

        // create the second column for each segment.
        tr.append("td").text(function(d){ return d.type;});

        // create the third column for each segment.
        tr.append("td").attr("class",'legendFreq')
          .text(function(d){ return d3.format(",")(d.freq);});

        // create the fourth column for each segment.
        tr.append("td").attr("class",'legendPerc')
          .text(function(d){ return getLegend(d,lD);});

        // Utility function to be used to update the legend.
        leg.update = function(nD){
            // update the data attached to the row elements.
            var l = legend.select("tbody").selectAll("tr").data(nD);

            // update the frequencies.
            l.select(".legendFreq").text(function(d){ return d3.format(",")(d.freq);});

            // update the percentage column.
            l.select(".legendPerc").text(function(d){ return getLegend(d,nD);});        
        }

        function getLegend(d,aD){ // Utility function to compute percentage.
            return d3.format("%")(d.freq/d3.sum(aD.map(function(v){ return v.freq; })));
        }

        return leg;
    }
}
