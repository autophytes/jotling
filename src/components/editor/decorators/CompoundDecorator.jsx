import React from 'react';
import { CompositeDecorator } from 'draft-js';
import { List } from 'immutable';

const Span = (props) => <span>{props.children}</span>;

export class CompoundDecorator {
	constructor(decorators = []) {
		// Create an array of CompositeDecorators
		this.decorators = decorators.map((decorator) => {
			return decorator.strategy && decorator.component
				? new CompositeDecorator([decorator])
				: decorator;
		});
	}

	getDecorations(block) {
		// Create a nested array, top level for each character and nested level for each decorator option
		const emptyTuples = Array(block.getText().length).fill(
			Array(this.decorators.length).fill(null)
		);

		// [
		// 	[1, null, null],
		// 	[1, null, null],
		// 	[1, null, 3],
		// 	[1, null, 3],
		// 	[null, null, 3],
		// ];

		// Populate our emptyTuples
		const decorations = this.decorators.reduce((tuples, decorator, index) => {
			// Returns an immutable array the length of the text with the decorator key for the correct location
			const blockDecorations = decorator.getDecorations(block);
			// [null, null, 3, 3, null]

			// For each top level character index, updates the nested decorator array with the appropriate character list array for that decorator
			return tuples.map((tuple, tupleIndex) => {
				return [
					...tuple.slice(0, index),
					// Only the decorator's index in the nested array gets updated
					blockDecorations.get(tupleIndex),
					...tuple.slice(index + 1),
				];
			});
		}, emptyTuples);

		// NOTE: for an array of [null, null, null], we need to just return null
		// rather than the array or it will be treated as a key and render a component

		// Stringifies the 2nd & 3rd level arrays before passing to List
		// Instead of a true "key", we're passing a tuple string
		return List(decorations.map(JSON.stringify));

		// So if we had a 5 character string with 3 decorator options,
		// 	each "key" would be: 3 top level decorators
		/*
    [
     [null, null, 2],
     [null, null, 2],
     [null, null, 2],
     [null, null, 2],
     [null, null, 2],
    ] */
	}

	// Instead of expecting an actual key, it's our tuple from above
	getComponentForKey(key) {
		const tuple = JSON.parse(key);
		// Returns a component
		return (props) => {
			// Separates the decoratorProps from all other props
			const { decoratorProps, ...compositionProps } = props;
			const Composed = tuple.reduce((Composition, decoration, index) => {
				if (decoration !== null) {
					const decorator = this.decorators[index];
					// Grabs the current component to render
					const Component = decorator.getComponentForKey(decoration);
					// Only includes the decoratorProps for this specific decorator
					const componentProps = {
						...compositionProps,
						...decoratorProps[index],
					};
					return () => (
						// Wraps each layer of components in the next level
						<Component {...componentProps}>
							<Composition {...compositionProps} />
						</Component>
					);
				}
				return Composition;
			}, Span);
			return (
				// Returns the final combined components
				<Composed>{props.children}</Composed>
			);
		};
	}

	getPropsForKey(key) {
		const tuple = JSON.parse(key);
		return {
			decoratorProps: tuple.map((decoration, index) => {
				const decorator = this.decorators[index];
				return decoration !== null ? decorator.getPropsForKey(decoration) : {};
			}),
		};
	}
}
