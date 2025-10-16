import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

interface PuckPosition {
  time: number;
  x: number;
  y: number;
}

interface PuckHeatmapProps {
  puckPositions: [];
  width?: number;
  height?: number;
}

const PuckHeatmap: React.FC<PuckHeatmapProps> = ({
  puckPositions,
  width = 600,
  height = 300
}) => {
  console.log(puckPositions)
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || puckPositions.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous content

    // Create heatmap data
    const data = puckPositions.map(pos => [pos[1], pos[2]]);
    console.log(data)
    console.log(data[0])

    // Create x and y scales
    const xScale = d3.scaleLinear()
      .domain([0, 100])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([0, 100])
      .range([height, 0]);

    // Create color scale
    const colorScale = d3.scaleSequential(d3.interpolatePlasma)
      .domain([0, d3.max(data, d => d[1]) || 100]);

    // Create heatmap
    const heatmap = svg.append('g');

    data.forEach(([x, y]) => {
      heatmap.append('circle')
        .attr('cx', xScale(x))
        .attr('cy', yScale(y))
        .attr('r', 3)
        .attr('fill', colorScale(y))
        .attr('opacity', 0.6);
    });

    // Add rink outline (simplified)
    const rinkOutline = [
      [10, 10], [90, 10], [90, 90], [10, 90], [10, 10]
    ];

    const line = d3.line()
      .x(d => xScale(d[0]))
      .y(d => yScale(d[1]));

    svg.append('path')
      .datum(rinkOutline)
      .attr('d', line as any)
      .attr('stroke', 'blue')
      .attr('fill', 'none')
      .attr('stroke-width', 1);

  }, [puckPositions, width, height]);

  return (
    <div className="puck-heatmap">
      <h3>Puck Position Heatmap</h3>
      <svg ref={svgRef} width={width} height={height} />
    </div>
  );
};

export default PuckHeatmap;