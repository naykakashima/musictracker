'use client';
import { ParentSize } from '@visx/responsive';
import { hierarchy, partition } from 'd3-hierarchy';
import { Group } from '@visx/group';
import { scaleOrdinal } from '@visx/scale';
import * as d3 from 'd3-shape';
import { useState, useMemo } from 'react';
import { SunburstData, GenreData } from '@/types/genres';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Type guard to check if node is GenreData
function isGenreData(node: unknown): node is GenreData {
  return typeof node === 'object' && node !== null && 'value' in node && typeof (node as GenreData).value === 'number';
}

// Modern color palette with vibrant colors
const colorScale = scaleOrdinal({
  domain: [
    'pop', 'rock', 'hip-hop', 'electronic', 'jazz', 'classical', 'r&b', 'rap',
    'indie', 'folk', 'country', 'metal', 'punk', 'blues', 'soul', 'funk', 'reggae'
  ],
  range: [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', 
    '#8AC249', '#FFD700', '#FF7373', '#7CDDDD', '#B5A8FF', '#FFA07A',
    '#98D8C8', '#F06292', '#FDBCB4', '#81D4FA', '#C5E1A5'
  ],
});

export function GenreSunburst({ data }: { data: SunburstData }) {
  // State for hover interactions
  const [hoveredNode, setHoveredNode] = useState<any>(null);
  const [tooltipData, setTooltipData] = useState<{ name: string; value: number } | null>(null);

  // Memoize the hierarchy calculation
  const root = useMemo(() => {
    const rootNode = hierarchy<SunburstData>(data)
      .sum(d => (isGenreData(d) ? d.value : 0))
      .sort((a, b) => (b.value || 0) - (a.value || 0));
    return partition<SunburstData>().size([2 * Math.PI, rootNode.height + 1])(rootNode);
  }, [data]);

  // Calculate total value for percentages
  const totalValue = root.value || 1;

  // Handle empty data
  if (!data.children?.length) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">No genre data available</p>
      </div>
    );
  }

  return (
    <Card className="w-full h-full overflow-hidden bg-white/50 backdrop-blur-sm shadow-xl border-0">
      <CardContent className="p-0 h-full">
        <div className="relative h-full">
          <TooltipProvider>
            <ParentSize>
              {({ width, height }) => {
                const radius = Math.min(width, height) / 2 * 0.85; // Slightly smaller to fit inside card
                
                return (
                  <svg width={width} height={height}>
                    <Group top={height / 2} left={width / 2}>
                      {root.descendants().map((node, i) => {
                        // Skip the root node (center)
                        if (node.depth === 0) return null;
                        
                        // Use d3.arc() to create an arc generator
                        const arcGenerator = d3.arc();
                        
                        // Calculate angles for labels
                        const centerAngle = node.x0 + (node.x1 - node.x0) / 2;
                        const labelRadius = (node.depth + 0.5) * radius / 3;
                        const [labelX, labelY] = [
                          Math.sin(centerAngle) * labelRadius,
                          -Math.cos(centerAngle) * labelRadius,
                        ];

                        // Calculate if there is enough space for label
                        const arcLength = (node.x1 - node.x0) * labelRadius;
                        const hasSpaceForLabel = arcLength > 25;
                        
                        // Calculate percentage
                        const percentage = ((node.value || 0) / totalValue) * 100;
                        
                        return (
                          <Tooltip key={`arc-${i}`}>
                            <TooltipTrigger asChild>
                              <motion.g
                                onMouseEnter={() => {
                                  setHoveredNode(node);
                                  setTooltipData({
                                    name: node.data.name,
                                    value: node.value || 0
                                  });
                                }}
                                onMouseLeave={() => {
                                  setHoveredNode(null);
                                  setTooltipData(null);
                                }}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ 
                                  opacity: 1, 
                                  scale: hoveredNode === node ? 1.05 : 1,
                                  transition: { duration: 0.3 }
                                }}
                                whileHover={{ scale: 1.05 }}
                                transition={{ 
                                  type: "spring", 
                                  stiffness: 300, 
                                  damping: 20 
                                }}
                              >
                                <motion.path
                                  d={arcGenerator({
                                    innerRadius: (node.depth * radius) / 3,
                                    outerRadius: ((node.depth + 1) * radius) / 3,
                                    startAngle: node.x0 || 0,
                                    endAngle: node.x1 || 0,
                                    padAngle: 0.02,
                                  }) || ''}
                                  fill={colorScale(node.data.name)}
                                  stroke="white"
                                  strokeWidth={1}
                                  style={{ 
                                    cursor: 'pointer',
                                    filter: hoveredNode === node ? 'drop-shadow(0 0 4px rgba(0,0,0,0.3))' : 'none'
                                  }}
                                />
                                {/* Show labels only for larger arcs */}
                                {node.depth === 1 && hasSpaceForLabel && (
                                  <text
                                    x={labelX}
                                    y={labelY}
                                    dy=".33em"
                                    fontSize={10}
                                    fontWeight="bold"
                                    textAnchor="middle"
                                    fill="#333"
                                    style={{ 
                                      pointerEvents: 'none',
                                      textShadow: '0 0 3px white'
                                    }}
                                  >
                                    {node.data.name}
                                  </text>
                                )}
                              </motion.g>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="bg-slate-900/90 text-white p-3 rounded-lg shadow-xl">
                              <div className="font-medium text-base">{node.data.name}</div>
                              <div className="text-sm opacity-90 mt-1">
                                {percentage.toFixed(1)}% of your listening
                              </div>
                              <div className="text-xs text-slate-300 mt-1">
                                Score: {node.value?.toFixed(1)}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}

                      {/* Center circle with total info */}
                      <motion.circle
                        r={radius / 6}
                        fill="white"
                        stroke="#e2e8f0"
                        strokeWidth={1}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                      />
                      <motion.text
                        textAnchor="middle"
                        dy="-0.5em"
                        fontSize={12}
                        fontWeight="bold"
                        fill="#333"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                      >
                        Your Top
                      </motion.text>
                      <motion.text
                        textAnchor="middle"
                        dy="0.8em"
                        fontSize={12}
                        fontWeight="bold"
                        fill="#333"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.7 }}
                      >
                        Genres
                      </motion.text>
                    </Group>
                  </svg>
                );
              }}
            </ParentSize>
          </TooltipProvider>
          
          {/* Summary panel at the bottom */}
          {tooltipData ? (
            <motion.div 
              className="absolute bottom-4 left-0 right-0 mx-auto w-3/4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-3 text-center"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              <p className="text-sm font-bold">{tooltipData.name}</p>
              <p className="text-xs text-gray-600">
                {((tooltipData.value / totalValue) * 100).toFixed(1)}% of your listening
              </p>
            </motion.div>
          ) : (
            <motion.div 
              className="absolute bottom-4 left-0 right-0 mx-auto w-3/4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-3 text-center"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 0.8 }}
              transition={{ delay: 0.8 }}
            >
              <p className="text-sm font-medium">Hover over segments to see details</p>
              <p className="text-xs text-gray-600">Based on your listening history</p>
            </motion.div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}