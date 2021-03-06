// change this on ia64 or alpha..
var USER_HZ = 100;

function getNumCpus()
{
  var cpuinfo = File.read(window.procfs.path + '/cpuinfo');
  if (cpuinfo.error == null) {
    return cpuinfo.content.match(/^processor/mg).length;
  } else {
    return -1;
  }
}

function getProcStatLine(nthCpu)
{
  var core = 'cpu' + nthCpu;
  var file = File.read(window.procfs.path + '/stat');
  if (file.error == null) {
    var content = file['content'].split('\n');
    for (ln in content) {
      var line = content[ln];
      if (line.slice(0,core.length) == core) {
        return line.slice(core.length + 1);
      }
    }
    return 'no core info for ' + core;
  } else {
    return null;
  }
}

function coreInfo(nthCpu)
{
  var line = getProcStatLine(nthCpu);
  if (line != null) {
    var entries = line.split(' ');
    return { 'user':       parseInt(entries[0])
           , 'nice':       parseInt(entries[1])
           , 'system':     parseInt(entries[2])
           , 'idle':       parseInt(entries[3])
           , 'iowait':     parseInt(entries[4])
           , 'irq':        parseInt(entries[5])
           , 'softirq':    parseInt(entries[6])
           , 'steal':      parseInt(entries[7])
           , 'guest':      parseInt(entries[8])
           , 'guest_nice': parseInt(entries[9])
           };
  }
}

// pre: previous coreInfo
// now: current  coreInfo
function cpuUsagePercent(pre, now)
{
  var diff_idle = (now.idle + now.iowait) - (pre.idle + pre.iowait);

  var now_total = now.user + now.system + now.idle + now.iowait;
                + now.irq + now.softirq + now.steal + now.guest + now.guest_nice;

  var pre_total = pre.user + pre.system + pre.idle + pre.iowait;
                + pre.irq + pre.softirq + pre.steal + pre.guest + pre.guest_nice;

  var diff_total = now_total - pre_total;

  return 100 * (diff_total - diff_idle) / diff_total;
}

function cpuUsagePercentSinceBoot(now)
{
  var muptime = File.read(window.procfs.path + '/uptime');

  if (muptime.error == null) {
    var uptime = parseInt(muptime.content.split(' ')[0]);

    var total = now.user + now.system + now.irq + now.softirq
              + now.steal + now.guest + now.guest_nice;

    return 100 * (total / USER_HZ) / uptime;

  } else {
    return 0;
  }
}

if (window.procfs == null) {
  window.procfs = { path: '/proc' }
}

window.procfs.cpuinfo =
  { getNumCpus: getNumCpus
  , coreInfo: coreInfo
  , cpuUsagePercent: cpuUsagePercent
  , cpuUsagePercentSinceBoot: cpuUsagePercentSinceBoot
  };
