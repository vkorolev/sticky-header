(function (angular) {
	'use strict';

	angular.module('sticky-header')
		.directive('stickyHeader', StickyHeader)
		.directive('stickyViewer', StickyViewer);

	StickyHeader.$inject = [
		'$window',
		'$rootScope',
		'$timeout',
		'_'
	];

	function StickyViewer() {
		return {
			restrict: 'A',
			controller: ['$element', function (element) {
				this.element = element;
			}]
		};
	}

	function StickyHeader($window, $rootScope, $timeout, _) {
		return {
			restrict: 'A',
			require: ['stickyHeader', '^stickyViewer'],
			controller: function () {
				this.header = null;

				this.th = function (head) {
					return Array.prototype.map.call(head.find('th'), function (element) {
						return angular.element(element);
					});
				};

				this.thLength = function (head) {
					return head.find('th').length;
				};
			},
			compile: function (element) {
				var originHeader = element.find('thead'),
					 stickyHeader = originHeader.clone();

				stickyHeader.addClass('sticky');
				stickyHeader.css({
					'position': 'absolute',
					'overflow-x': 'hidden'
				});

				originHeader.addClass('origin');
				originHeader.css('visibility', 'hidden');
				originHeader.after(stickyHeader);

				originHeader.on('$destroy', function () {
					stickyHeader.remove();
				});

				return function postLink(scope, element, attrs, ctrls) {
					var table = element[0],
						ctrl = ctrls[0],
						viewer = ctrls[1],
						stickyHeader = angular.element(table.querySelector('thead.sticky')),
						originHeader = ctrl.header = angular.element(table.querySelector('thead.origin')),
						scrollView = viewer.element;

					var invalidate = function () {
							 var sticky = ctrl.th(stickyHeader),
								  origin = ctrl.th(originHeader),
								  headerStyle = $window.getComputedStyle(scrollView[0]),
								  offset = stickyHeader[0].offsetHeight + 'px';

							 if (offset !== '0px') {
								 stickyHeader.css({minWidth: headerStyle.width, maxWidth: headerStyle.width});
								 stickyHeader.css('margin-top', '-' + offset);
								 scrollView.css('margin-top', offset);
								 element.css('margin-top', '-' + offset);

								 sticky.forEach(function (th, index) {
									 var thStyle = $window.getComputedStyle(origin[index][0]);
									 th.css({
										 minWidth: thStyle.width,
										 maxWidth: thStyle.width
									 });
								 });
								 return true;
							 }

							 return false;
						 },
						 invalidateSome = _.debounce(invalidate, 300);

					var attach = function () {
						var sticky = ctrl.th(stickyHeader),
							 origin = ctrl.th(originHeader);

						sticky.forEach(function (th, index) {
							if (th.data('sticky')) {
								return;
							}

							th.data('sticky', true);
							origin[index].on('$destroy', function () {
								th.remove();
							});
						});
					};

					angular.element($window).on('resize', invalidate);

					scrollView.on('scroll', function () {
						stickyHeader.prop('scrollLeft', scrollView.prop('scrollLeft'));
					});

					scope.$watch(
						 function () {
							 return ctrl.thLength(stickyHeader);
						 },
						 function (value) {
							 console.debug('stickyHeader: header length changed: %s', value);
							 attach();
							 $timeout(invalidate, 0);
						 });

					scope.$on('$destroy', function () {
						angular.element($window).off('resize', invalidate);
					});

					$rootScope.$watch(function () {
						invalidateSome();
						return 1;
					}, angular.noop())
				}
			}
		};
	}
})(angular);
