import React from 'react';

const TextColorSVG = ({ color }) => {
	return (
		<svg
			// xmlns='http://www.w3.org/2000/svg'
			// xmlns:xlink='http://www.w3.org/1999/xlink'
			// xmlns:svgjs='http://svgjs.com/svgjs'
			// version='1.1'
			// width='512'
			// height='512'
			// x='0'
			// y='0'
			viewBox='0 0 512 512'
			style={{ enableBackground: 'new 0 0 512 512' }}
			// xml:space='preserve'
		>
			{/* <g style={{ opacity: '0.36' }}> */}
			<rect
				y='426.64'
				width='512'
				height='85.333'
				style={color ? { fill: color } : {}}
				stroke='black'
				strokeWidth='10'
				strokeLinecap='square'
				strokeOpacity='0.5'
			/>
			{/* </g> */}
			<g transform='matrix(1.14,0,0,1.14,-35.839999999999975,-35.839999999999975)'>
				<path d='M277.333,32h-42.667L117.333,330.667h48l24-64h133.333l24,64h48L277.333,32z M205.333,224L256,88.853L306.667,224H205.333    z' />
			</g>
		</svg>
	);
};

export default TextColorSVG;
