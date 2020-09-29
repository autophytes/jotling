import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { usePopper } from 'react-popper';

const AddLinkPopper = ({
	referenceElement,
	closeFn,
	children,
	leftOffset = 0,
	rightOffset = 0,
	isContentRendered = true,
}) => {
	// REFS
	const popperElement = useRef(null);
	const arrowElement = useRef(null);

	// STATE
	const [minWidth, setMinWidth] = useState(0);

	// POPPER
	const { styles, attributes } = usePopper(referenceElement, popperElement.current, {
		placement: 'top',
		modifiers: [
			{ name: 'arrow', options: { element: arrowElement.current } },
			{
				name: 'offset',
				options: {
					offset: [0, 10],
				},
			},
			{ name: 'flip', options: { padding: 100 } },
			{
				name: 'preventOverflow',
				options: {
					padding: { left: leftOffset, right: rightOffset },
				},
			},
		],
	});

	// Add listener to stop text blur on
	// NOTE: this didn't stop the selection text blur, but we probably should :)
	// useEffect(() => {
	// 	console.log('blur being stopped??');
	// 	const handleStopBlur = (e) => {
	// 		e.preventDefault();
	// 	};

	// 	document.addEventListener('mousedown', handleStopBlur);

	// 	return () => {
	// 		document.removeEventListener('mousedown', handleStopBlur);
	// 	};
	// }, []);

	// NEED TO UPDATE - close function
	// Closes the popper if clicking outside the popper or hitting escape
	useEffect(() => {
		const handleEscapePopper = (e) => {
			console.log('click or keypress triggered');
			if (!popperElement.current.contains(e.target) || e.keyCode === 27) {
				e.stopPropagation();
				console.log('propagation is being stopped!!');

				closeFn();
			}
		};

		document.addEventListener('click', handleEscapePopper);
		document.addEventListener('keyup', handleEscapePopper);

		return () => {
			document.removeEventListener('click', handleEscapePopper);
			document.removeEventListener('keyup', handleEscapePopper);
		};
	}, []);

	useLayoutEffect(() => {
		if (minWidth === 0 && isContentRendered) {
			setMinWidth(popperElement.current.clientWidth / 2 + 15);
		}
	}, [minWidth, isContentRendered]);

	return (
		<div
			ref={popperElement}
			style={styles.popper}
			{...attributes.popper}
			id='link-popper-element'>
			<div className='link-popper' style={{ minWidth: minWidth }}>
				{/* PASS THROUGH CHILDREN */}
				{children}

				<div ref={arrowElement} className='link-popper-arrow' style={styles.arrow} />
			</div>
		</div>
	);
};

export default AddLinkPopper;
