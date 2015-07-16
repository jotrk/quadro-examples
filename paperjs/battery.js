var batteries = [ '/org/freedesktop/UPower/devices/battery_BAT0'
                , '/org/freedesktop/UPower/devices/battery_BAT1'
                ];

var fontFamily = 'Ubuntu Light';
var fontSize = 50;

var statusGap = 10;
var statusRadius = 50;
var statusStrokeWidth = 40;

var statusEmptyColor   = '#ff0000';
var statusFullColor    = '#00ff00';
var statusNeutralColor = '#808080';

/******************************************************************************/

var size = view.size;
var center = { x: size.width / 2, y: size.height / 2 };

var g_status = {};
var g_base_circles = new Layer();
var g_status_circles = new Layer();

function getPosition(i)
{
  var x = statusStrokeWidth / 2 + statusGap + statusRadius
        + 2 * i * (statusStrokeWidth / 2 + statusGap + statusRadius);
  var y = statusStrokeWidth / 2 + statusGap + statusRadius;
  return new Point(x, y);
}

function initPercentage()
{
  for (var i in batteries) {
    var path = batteries[i];
    var state = upowerGetDeviceProperty(path, 'State');
    var percentage = upowerGetDeviceProperty(path, 'Percentage');
    g_status[path] = { 'state': state, 'percentage': percentage };
  }
}

function initBaseCircles()
{
  var i = 0;
  for (var path in g_status) {
    var c = new Path.Circle(
        { center: getPosition(i)
        , radius: statusRadius
        , opacity: 0.4
        , strokeColor: statusNeutralColor
        , strokeWidth: statusStrokeWidth
        });

    g_base_circles.addChild(c);
    ++i;
  }
}

function renderStatusCircles()
{
  g_status_circles.removeChildren();

  var i = 0;
  for (var path in g_status) {
    var state      = g_status[path]['state'];
    var percentage = g_status[path]['percentage'];

    var angle = percentage / 100 * 360;
    var points = arcPathPoints(getPosition(i), angle, statusRadius);
    var arc = new Path.Arc(points);

      // 0: Unknown
      // 1: Charging
      // 2: Discharging
      // 3: Empty
      // 4: Fully charged
      // 5: Pending charge
      // 6: Pending discharge

    if (state == 0) {
      arc.strokeColor = statusNeutralColor;
    } else if (state == 2) {
      arc.strokeColor = statusEmptyColor;
    } else {
      arc.strokeColor = statusFullColor;
    }

    arc.strokeWidth = statusStrokeWidth;

    g_status_circles.addChild(arc);
    ++i;
  }

  paper.view.update();
}

function update(msg)
{
  if (msg.signal == 'PropertiesChanged') {
    g_status[msg.path]['state'] = msg.contents[1]['State'];
    g_status[msg.path]['percentage'] = msg.contents[1]['Percentage'];
  }
  renderStatusCircles();
}

initPercentage();
initBaseCircles();
renderStatusCircles();

DBus.system.attach(
    'org.freedesktop.UPower',
    '/org/freedesktop/UPower/devices/battery_BAT1',
    'org.freedesktop.DBus.Properties',
    'PropertiesChanged');

DBus.system.notify.connect(this, update);
