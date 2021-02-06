import React, { useContext, useState } from 'react';
import Collapse from 'react-css-collapse';
import CaratDownSVG from '../../../assets/svg/CaratDownSVG';

import { StatsContext } from '../../../contexts/statsContext';
import { addThousandsComma } from '../../../utils/utils';

// Project: 1,210 words added
// Project: 390 words removed
// Document: -300 net words

const LeftNavStats = ({ currentDoc }) => {
	const { docsNetWordCountObj, docWordCountObj } = useContext(StatsContext);
	const [isExpanded, setIsExpanded] = useState(true);

	// FOR BOTH, need to add thousands-place commas

	const wordsAdded = Object.values(docsNetWordCountObj).reduce(
		(acc, value) => (value > 0 ? acc + value : acc),
		0
	);
	const wordsRemoved = Math.abs(
		Object.values(docsNetWordCountObj).reduce(
			(acc, value) => (value < 0 ? acc + value : acc),
			0
		)
	);
	const totalDocWords = Object.values(docWordCountObj).reduce((acc, value) => acc + value, 0);

	return (
		<div className='left-nav-footer'>
			{/* Show/Hide Toggle */}
			<div
				className={'left-nav-stats-toggle' + (isExpanded ? ' expanded' : '')}
				onClick={() => setIsExpanded((prev) => !prev)}>
				<CaratDownSVG rotate='180' />
				{isExpanded ? 'Hide' : 'Show'} Stats
			</div>

			{/* Stats Section */}
			<Collapse isOpen={isExpanded}>
				{/* Project */}
				<p className='left-nav-stats-section-title'>Project:</p>
				<div className='left-nav-stats-section'>
					{/* Added */}
					<p style={{ margin: '0' }}>{`${addThousandsComma(wordsAdded)} word${
						wordsAdded === 1 ? '' : 's'
					} added`}</p>

					{/* Removed */}
					<p style={{ margin: '0' }}>{`${addThousandsComma(wordsRemoved)} word${
						wordsRemoved === 1 ? '' : 's'
					} removed`}</p>
				</div>

				{/* Document */}
				<p className='left-nav-stats-section-title'>Document:</p>
				<div className='left-nav-stats-section'>
					{/* Net */}
					<p style={{ margin: '0' }}>
						{(docsNetWordCountObj[currentDoc]
							? addThousandsComma(Math.abs(docsNetWordCountObj[currentDoc]))
							: 0) +
							' word' +
							(docsNetWordCountObj[currentDoc] === 1 ? '' : 's') +
							(docsNetWordCountObj[currentDoc] >= 0 ? ' added' : ' removed')}
					</p>
					{/* Total */}
					<p style={{ margin: '0' }}>
						{addThousandsComma(totalDocWords) +
							' total word' +
							(totalDocWords === 1 ? '' : 's')}
					</p>
				</div>
			</Collapse>
		</div>
	);
	{
		/* <p>497 words</p><p>49% today's goal</p> */
	}
};

export default LeftNavStats;
