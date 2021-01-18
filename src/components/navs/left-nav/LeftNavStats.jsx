import React, { useContext } from 'react';

import { StatsContext } from '../../../contexts/statsContext';

const LeftNavStats = () => {
	const { docWordCount, sessionWordCount } = useContext(StatsContext);

	const numOfWords = Math.max(0, docWordCount + sessionWordCount);
	return (
		<div className='left-nav-footer'>
			<p className='left-nav-stats-words-today'>{`${numOfWords} word${
				numOfWords === 1 ? '' : 's'
			} today.`}</p>
		</div>
	);
	{
		/* <p>497 words</p><p>49% today's goal</p> */
	}
};

export default LeftNavStats;
