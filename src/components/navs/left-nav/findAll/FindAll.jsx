import React, { useState } from 'react';

import CaratDownSVG from '../../../../assets/svg/CaratDownSVG';
import CloseSVG from '../../../../assets/svg/CloseSVG';

import Collapse from 'react-css-collapse';

const FindAll = () => {
	const [showReplace, setShowReplace] = useState(false);
	const [findText, setFindText] = useState('');
	const [replaceText, setReplaceText] = useState('');

	return (
		<div className='side-nav-container'>
			<p className='left-nav-section-title'>Find</p>

			<div className='project-find-container'>
				<p className='find-containter-counter'>
					{/* {findText && findRegisterRef.current[findText.toLowerCase()] && totalMatches
					? `${findIndex === null ? 1 : findIndex + 1} of ${totalMatches}`
					: '0 matches'} */}
					3 out of 27
				</p>
				<div
					className='find-container-svg'
					// onClick={() => updateFindIndex('DECREMENT')}
				>
					<CaratDownSVG rotate='90' />
				</div>
				<div
					className='find-container-svg'
					// onClick={() => updateFindIndex('INCREMENT')}
				>
					<CaratDownSVG rotate='-90' />
				</div>
				<div
					className='find-container-svg'
					onClick={() => {
						// setContextFindText('');
						// setShowFindReplace(false);
					}}>
					<CloseSVG />
				</div>

				<div
					className={'find-container-svg' + (showReplace ? ' expanded' : '')}
					onClick={() => setShowReplace(!showReplace)}>
					<CaratDownSVG rotate='-90' />
				</div>

				<div>
					<div style={{ display: 'flex' }}>
						<input
							type='text'
							placeholder='Find'
							// ref={findInputRef}
							value={findText}
							onChange={(e) => {
								console.log('on change fired');
								// findRegisterRef.current[e.target.value.toLowerCase()] = [];
								setFindText(e.target.value);
								// setContextFindText(e.target.value);
							}}
							// onKeyDown={handleInputEnter}
						/>
					</div>
					<Collapse isOpen={showReplace}>
						<div
							style={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
							}}>
							<input
								type='text'
								placeholder='Replace'
								// ref={replaceInputRef}
								value={replaceText}
								onChange={(e) => {
									setReplaceText(e.target.value);
									// setContextReplaceText(e.target.value);
								}}
							/>
						</div>
						<button
							className='find-container-replace-button'
							// onClick={handleReplaceSingle}
						>
							Replace
						</button>
						<button
							className='find-container-replace-button'
							// onClick={handleReplaceAll}
						>
							Replace All
						</button>
					</Collapse>
				</div>
			</div>
			{/* RESULTS */}
		</div>
	);
};

export default FindAll;
