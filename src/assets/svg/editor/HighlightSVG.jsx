import React from 'react';

const HighlightSVG = ({ color }) => {
	return (
		<svg
			// xmlns='http://www.w3.org/2000/svg'
			// xmlns:xlink='http://www.w3.org/1999/xlink'
			// version='1.1'
			// id='Capa_1'
			x='0px'
			y='0px'
			viewBox='0 0 512 512'
			style={{ enableBackground: 'new 0 0 512 512' }}
			// xml:space='preserve'
		>
			<g>
				<polygon points='85.333,282.64 85.333,362.64 165.333,362.64 378.667,149.307 298.667,69.307    ' />
				<path d='M441.707,56.08L391.893,6.267c-8.32-8.32-21.867-8.32-30.187,0L320,47.973l80,80l41.707-41.707     C450.027,77.947,450.027,64.4,441.707,56.08z' />
			</g>

			{/* <g style={{ opacity: '0.36' }}> */}
			<rect
				y='406.64'
				width='512'
				height='105.333'
				style={color ? { fill: color } : {}}
				stroke='black'
				strokeWidth='10'
				strokeLinecap='square'
				strokeOpacity='0.5'
			/>
			{/* </g> */}
		</svg>
	);
};

export default HighlightSVG;
