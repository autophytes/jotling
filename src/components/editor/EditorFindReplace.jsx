import React from 'react';

import CaratDownSVG from '../../assets/svg/CaratDownSVG';
import CloseSVG from '../../assets/svg/CloseSVG';

const EditorFindReplace = () => {
	// NEXT
	// When expanding, transition down to display the replace below
	// Hook up ctrl + f to Electron
	// Iterate through the text looking for matches, highlight the ranges
	// Escape / X closes
	// https://reactrocket.com/post/draft-js-search-and-replace/
	// https://jsfiddle.net/levsha/o3xyvkw7/

	return (
		<div className='editor-find-container'>
			<div className='find-container-svg'>
				<CaratDownSVG rotate='-90' />
			</div>
			<input type='text' placeholder='Find' />
			<p className='find-containter-counter'>999 of 999</p>
			<div className='find-container-svg'>
				<CaratDownSVG rotate='90' />
			</div>
			<div className='find-container-svg'>
				<CaratDownSVG rotate='-90' />
			</div>
			<div className='find-container-svg'>
				<CloseSVG />
			</div>
		</div>
	);
};

export default EditorFindReplace;
