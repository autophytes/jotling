import React, { useEffect, useCallback } from 'react';

const PopupModal = (props) => {
	// REQUIRES the setter 'setDisplayModal' as props
	const setDisplayModal = props.setDisplayModal;
	const width = props.width;

	// Disables body scroll when modal is open
	useEffect(() => {
		document.body.style.overflow = 'hidden';
		return () => (document.body.style.overflow = 'unset');

		// document.documentElement.style.overflowY = 'scroll';
		// document.documentElement.style.position = 'fixed';
		// document.documentElement.style.width = '100%';
		// return () => {
		// 	document.documentElement.style.overflowY = 'auto';
		// 	document.documentElement.style.position = 'static';
		// 	document.documentElement.style.width = 'auto';
		// };
	}, []);

	// Toggle modal off if clicking outside the modal
	const handleModalWrapperClick = (e) => {
		e.persist();
		e.stopPropagation();
		if (e.target.id === 'modal-wrapper') {
			e.preventDefault();
			setDisplayModal(false);
		}
	};

	// If the escape key is pressed, close the modal
	const handleEscape = useCallback(
		(e) => {
			if (e.keyCode === 27) {
				document.removeEventListener('keyup', handleEscape, false);
				setDisplayModal(false);
			}
		},
		[setDisplayModal]
	);

	// Adds the ESC key event listener
	useEffect(() => {
		document.addEventListener('keyup', handleEscape, false);
		return () => window.removeEventListener('keyup', handleEscape);
	}, [handleEscape]);

	return (
		<div
			className={`quick-add-modal-wrapper`}
			onClick={handleModalWrapperClick}
			// style={{ zIndex: 999 }}
			id='modal-wrapper'>
			<div className='quick-add-modal' style={!!width ? { width: width } : {}}>
				{props.children}
			</div>
		</div>
	);
};

export default PopupModal;
