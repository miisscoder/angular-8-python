$(document).ready(function () {
    function profitChart() {
        var margin = {
            top: 20,
            right: 30,
            bottom: 30,
            left: 40
        };
        var width = 500;
        var height = 250;
        var x = d3.scaleUtc()
            .domain([new Date(2006, 10, 27), new Date(2019, 11, 8)])
            .range([margin.left, width - margin.right]);

        var y = d3.scaleLinear()
            .domain([0, 90]).nice()
            .range([height - margin.bottom, margin.top]);

        var xAxis = g => g
            .attr('transform', `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0));

        var yAxis = g => g
            .attr('transform', `translate(${margin.left},0)`)
            .call(d3.axisLeft(y))
            .call(g => g.select('.domain').remove())
            .call(g => g.select('.tick:last-of-type text').clone()
                .attr('x', 3)
                .attr('text-anchor', 'start')
                .attr('font-weight', 'bold'));


        const svg = d3.select('#chart')
            .append('svg')
            .attr('viewBox', [0, 0, width, height]);

        svg.append('g')
            .call(xAxis);

        svg.append('g')
            .call(yAxis);

        function chartLine(filename, i) {
            $.getJSON(filename, function (data) {
                var line = d3.line()
                    .defined(d => !isNaN(d.profit))
                    .x(d => x(new Date(d.date.split('-')[0],
                        d.date.split('-')[1], d.date.split('-')[2])))
                    .y(d => y(d.profit));

                var g = svg.append('g')
                    .style('opacity', 1)
                    .attr('id', 'G' + i)
                    .on('click', () => {
                        var opacity =
                            d3.select('#G' + i)
                                .style('opacity');
                        d3.select('#G' + i)
                            .style('opacity', Number(opacity) === 1 ? 0.5 : 1);
                    });
                g.append('path')
                    .datum(data)
                    .attr('fill', 'none')
                    .attr('stroke', 'steelblue')
                    .attr('stroke-width', 1.5)
                    .attr('stroke-linejoin', 'round')
                    .attr('stroke-linecap', 'round')
                    .attr('d', line);

                g.append('text')
                    .datum(data)
                    .text(filename.substring(5,
                        filename.length - 5))
                    .attr('x', d =>
                        x(new Date(d[d.length - 1].date.split('-')[0],
                            d[d.length - 1].date.split('-')[1],
                            d[d.length - 1].date.split('-')[2])) - 10)
                    .attr('y', d => y(d[d.length - 1].profit))
                    .attr('font-size', 8);
            });
        }
        chartLine('data-4-1.02-1.01.json', 0);
        chartLine('data-4-1.05-1.01.json', 1);
        chartLine('data-stock.json', 3);
    }
    //profitChart();

    function profitStasticChart() {
        var margin = {
            top: 20,
            right: 30,
            bottom: 30,
            middle: 40,
            left: 40
        };
        var width = 500;
        var height = 500;
        var x = d3.scaleUtc()
            .domain([new Date(2006, 10, 27), new Date(2019, 11, 8)])
            .range([margin.left, width - margin.right]);

        var yUp = d3.scaleLinear()
            .domain([0, 3000]).nice()
            .range([height / 2 + margin.top, margin.top]);
        
        var yDown = d3.scaleLinear()
            .domain([1, 0]).nice()
            .range([height / 2 + margin.top + margin.middle,
            height - margin.bottom]);

        var xAxis = g => g
            .attr('transform', `translate(0, ${height / 2 + margin.middle})`)
            .call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0));

        var yUpAxis = g => g
            .attr('transform', `translate(${margin.left},0)`)
            .call(d3.axisLeft(yUp))
            .call(g => g.select('.tick:last-of-type text').clone()
                .attr('x', 3)
                .attr('text-anchor', 'start')
                .attr('font-weight', 'bold'));

        var yDownAxis = g => g
            .attr('transform', `translate(${margin.left},0)`)
            .call(d3.axisLeft(yDown))
            .call(g => g.select('.tick:last-of-type text').clone()
                .attr('x', 3)
                .attr('text-anchor', 'start')
                .attr('font-weight', 'bold'));

        const svg = d3.select('#chart')
            .append('svg')
            .attr('viewBox', [0, 0, width, height]);

        svg.append('g')
            .call(xAxis);

        svg.append('g')
            .call(yUpAxis);
        svg.append('g')
            .call(yDownAxis);

        function chartLine(filename, i) {
            $.getJSON(filename, function (data) {
                var lineUp = d3.line()
                    .defined(d => !isNaN(d.timeGetProfit))
                    .x(d => x(new Date(d.date.split('-')[0],
                        d.date.split('-')[1], d.date.split('-')[2])))
                    .y(d => yUp(d.timeGetProfit));

                var lineDown = d3.line()
                    .defined(d => !isNaN(d.maxBottom))
                    .x(d => x(new Date(d.date.split('-')[0],
                        d.date.split('-')[1], d.date.split('-')[2])))
                    .y(d => yDown(d.maxBottom));

                var g = svg.append('g')
                    .style('opacity', 1)
                    .attr('id', 'G' + i)
                    .on('click', () => {
                        var opacity =
                            d3.select('#G' + i)
                                .style('opacity');
                        d3.select('#G' + i)
                            .style('opacity', Number(opacity) === 1 ? 0.5 : 1);
                    });

                g.append('path')
                    .datum(data)
                    .attr('fill', 'none')
                    .attr('stroke', 'steelblue')
                    .attr('stroke-width', 1.5)
                    .attr('stroke-linejoin', 'round')
                    .attr('stroke-linecap', 'round')
                    .attr('d', lineUp);


                g.append('path')
                    .datum(data)
                    .attr('fill', 'none')
                    .attr('stroke', 'steelblue')
                    .attr('stroke-width', 1.5)
                    .attr('stroke-linejoin', 'round')
                    .attr('stroke-linecap', 'round')
                    .attr('d', lineDown);
                
            });
        }
        chartLine('data-statistic-1.01.json', 0);
    }
    profitStasticChart();
})

