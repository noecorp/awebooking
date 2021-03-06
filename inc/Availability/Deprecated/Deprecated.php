<?php

namespace AweBooking\Availability\Deprecated;

use AweBooking\Model\Common\Timespan;
use AweBooking\Model\Common\Guest_Counts;

trait Deprecated {
	/**
	 * Alias of "get_los" method.
	 *
	 * @return int
	 */
	public function get_nights() {
		return $this->get_los();
	}

	/**
	 * Returns the timespan instance.
	 *
	 * @return \AweBooking\Model\Common\Timespan
	 */
	public function get_timespan() {
		return new Timespan(
			$this->get_parameter( 'check_in' ), $this->get_parameter( 'check_out' )
		);
	}

	/**
	 * Sets the check_in and check_out parameters by timespan.
	 *
	 * @param  \AweBooking\Model\Common\Timespan $timespan The timespan instance.
	 * @param  bool                              $lock     Lock parameters?.
	 * @return $this
	 */
	public function set_timespan( Timespan $timespan, $lock = false ) {
		$timespan->requires_minimum_nights( 1 );

		$this->set_parameter( 'check_in', $timespan->get_start_date() );
		$this->set_parameter( 'check_out', $timespan->get_end_date() );

		if ( $lock ) {
			$this->lock( 'check_in', 'check_out' );
		}

		return $this;
	}

	/**
	 * Gets the Guest_Counts.
	 *
	 * @return \AweBooking\Model\Common\Guest_Counts
	 */
	public function get_guest_counts() {
		return new Guest_Counts( $this->get_adults(), $this->get_children(), $this->get_infants() );
	}

	/**
	 * Sets the guest count.
	 *
	 * @param  string $age_code The guest age code.
	 * @param  int    $count    The count.
	 * @return $this
	 */
	public function set_guest_count( $age_code, $count = 0 ) {
		// $this->guest_counts[ $age_code ] = $count;

		return $this;
	}

	/**
	 * Sets the Guest_Counts.
	 *
	 * @param  \AweBooking\Model\Common\Guest_Counts $guest_counts The guest_counts.
	 * @return $this
	 */
	public function set_guest_counts( Guest_Counts $guest_counts ) {
		// $this->guest_counts = $guest_counts;

		return $this;
	}

	protected function initialize_from_objects( &$parameters ) {
		if ( isset( $parameters['timespan'] ) && $parameters['timespan'] instanceof Timespan ) {
			$timespan = $parameters['timespan'];

			$this->set_parameter( 'check_in', $timespan->get_start_date() );
			$this->set_parameter( 'check_out', $timespan->get_end_date() );

			unset( $parameters['timespan'] );
		}

		if ( isset( $parameters['guest_counts'] ) && $parameters['guest_counts'] instanceof Guest_Counts ) {
			$this->set_guest_count( $parameters['guest_counts'] );
			unset( $parameters['guest_counts'] );
		}
	}
}
