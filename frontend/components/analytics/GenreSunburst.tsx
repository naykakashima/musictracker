// components/analytics/GenreSunburst.tsx
'use client';
import { ParentSize } from '@visx/responsive';
import { hierarchy, partition } from 'd3-hierarchy';
import { Group } from '@visx/group';
import { scaleOrdinal } from '@visx/scale';
import * as d3 from 'd3-shape'; 
import { useMemo } from 'react';
import { SunburstData, GenreData } from '@/types/genres';
/**
 * The function `isGenreData` checks if a given node is of type `GenreData` by verifying if it is an
 * object with a `value` property of type number.
 * @param {unknown} node - The `node` parameter is of type `unknown`, which means it can be any type.
 * The `isGenreData` function is a type guard function that checks if the `node` parameter is of type
 * `GenreData`. It returns a boolean value indicating whether the `node` parameter satisfies the
 * @returns The function `isGenreData` is returning a boolean value. It checks if the `node` parameter
 * is of type `GenreData` by verifying if it is an object, not null, and has a property named `value`
 * with a numeric value. If all conditions are met, it returns `true`, indicating that the `node` is of
 * type `GenreData`. Otherwise, it returns
 */
function isGenreData(node: unknown): node is GenreData {
  return typeof node === 'object' && node !== null && 'value' in node && typeof (node as GenreData).value === 'number';
}

const colorScale = scaleOrdinal({
  domain: ['pop', 'rock', 'hip-hop', 'electronic', 'jazz', 'classical', 'r&b', 'rap'],
  range: [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#8AC249', '#FFD700'
  ],
});
      
export function GenreSunburst({ data }: { data: SunburstData }) {
/* This code block is using the `useMemo` hook in React to memoize the result of a complex computation
involving the data provided to the `GenreSunburst` component. */
  const root = useMemo(() => {
    const rootNode = hierarchy<SunburstData>(data)
        .sum(d => (isGenreData(d) ? d.value : 0)) // Sum values of children
        .sort((a, b) => (b.value || 0) - (a.value || 0)); // Sort by value (descending)
    return partition<SunburstData>().size([2 * Math.PI, rootNode.height + 1])(rootNode); 
  }, [data]);

  if (!data.children.length) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">No genre data available</p>
      </div>
    );
  }

  return (
    <ParentSize>
      {({ width, height }) => {
        const radius = Math.min(width, height) / 2;
  
        return (
          <svg width={width} height={height} className="overflow-visible">
            <Group top={height / 2} left={width / 2}>
              {root.descendants().map((node, i) => {
                // Use d3.arc() to create an arc generator
                const arcGenerator = d3.arc();
  
                const centerAngle = node.x0 + (node.x1 - node.x0) / 2;
                const labelRadius = (node.depth + 0.5) * radius / 3;
                const [labelX, labelY] = [
                  Math.sin(centerAngle) * labelRadius,
                  -Math.cos(centerAngle) * labelRadius,
                ];
  
                return (
                  <g key={`arc-${i}`}>
                    <path
                      d={arcGenerator({
                        innerRadius: (node.depth * radius) / 3,
                        outerRadius: ((node.depth + 1) * radius) / 3,
                        startAngle: node.x0 || 0,
                        endAngle: node.x1 || 0,
                        padAngle: 0.02,
                      }) || ''} // Generate the arc path
                      fill={colorScale(node.data.name)}
                      stroke="#fff"
                      strokeWidth={0.5}
                    />
                    {node.depth === 1 && (
                      <text
                        x={labelX}
                        y={labelY}
                        dy=".33em"
                        fontSize={10}
                        fontWeight="bold"
                        textAnchor="middle"
                        fill="#333"
                      >
                        {node.data.name}
                      </text>
                    )}
                  </g>
                );
              })}
            </Group>
          </svg>
        );
      }}
    </ParentSize>
  );
}