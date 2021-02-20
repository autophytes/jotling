import React from 'react';

const PopupModal = (props) => {
	// REQUIRES the setter 'setDisplayModal' as props
	// const setDisplayModal = props.setDisplayModal;
	const width = props.width;
	const zIndex = props.zIndex;

	const styles = {
		...(width ? { width } : {}),
		...(zIndex ? { zIndex } : {}),
	};

	console.log('no overlay');

	return (
		// <div className={`quick-add-modal-wrapper`} style={{ zIndex: 1000 }} id='modal-wrapper'>
		<div className='quick-add-modal no-overlay' style={styles}>
			{props.children}
		</div>
		// </div>
	);
};

export default PopupModal;
