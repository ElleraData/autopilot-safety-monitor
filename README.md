# Autopilot Telemetry

An educational driver-assistance simulation. It generates simulated sensor readings (speed, camera glare, distance to an object ahead, weather), judges each scan with a small set of rules, and shows the result on a dashboard with a car view.

It is an independent learning project. The data is simulated, the alerts are rule-based, and nothing here is vehicle telemetry or driving advice.

![Desktop view](docs/screenshot-desktop.png)

<img src="docs/screenshot-mobile.png" alt="Mobile view of the road scene and status panel" width="320">

## What it shows

- **A run of 10 scans.** Each scan is SAFE, WARNING or CRITICAL, and every rule that fired is listed as a reason.
- **Stopping-distance physics.** Alerts compare the object's distance with the distance the car needs to stop, not only with fixed speed limits.
- **A car in two views.** A glossy black car with gold trim and gold wheels. A top view on the road with the stopping zones and the detected object, and a side view that shows the simulated modifications on the wheels.
- **Black and gold look.** Dark by default, with an ivory and gold theme behind the **Ivory theme** button in the header. The choice is remembered in the browser.
- **Simulated modifications.** Performance tires, upgraded brakes and worn tires change grip and braking. The same seeded run is judged again, so you can compare setups on identical sensor values.
- **Reproducible runs.** A seed number fixes every sensor value. Enter the same seed to get the same run.
- **Three scenarios.** Highway cruise, Rainy city (the default) and Emergency braking, each with a preset seed.

## Run it

You need Node 18 or newer. There are no dependencies to install.

```bash
npm start        # serves the app at http://localhost:3000
npm test         # runs the unit tests
npm run build    # writes dist/index.html, the whole app in one file
```

The app is plain HTML, CSS and JavaScript, so any static host works as well (GitHub Pages, Netlify, Replit). On Replit, set the run command to `npm start`.

## How alerts are decided

The highest severity wins, and every rule that fired is shown. All numbers live in [`src/config.js`](src/config.js) and [`src/scenarios.js`](src/scenarios.js).

| Level | Rule | Triggers when |
|---|---|---|
| CRITICAL | Time to collision (TTC) | below 2 s |
| CRITICAL | Object distance | closer than the stopping distance |
| WARNING | Time to collision | below 4 s |
| WARNING | Object distance | inside 1.5 × the stopping distance |
| WARNING | Speed | at or above the scenario's speed alert |
| WARNING | Camera glare | at or above 60 % |
| WARNING | Speed in fog | above 60 km/h |
| WARNING | Speed in heavy rain | above 50 km/h |
| SAFE | Everything else | no rule fired |

Each scenario sets its own speed alert, because a motorway and a city street do not share one limit: Highway cruise 110 km/h, Rainy city 60 km/h, Emergency braking 60 km/h.

### The physics

```
v = speed in km/h ÷ 3.6                      (m/s)
stopping distance = v × t_reaction + v² ÷ (2 × μ × weather × g × brakes)
TTC = distance ÷ v
```

| Parameter | Value |
|---|---|
| Tire grip μ | 0.80 |
| Brake efficiency | 0.90 |
| Reaction time | 0.5 s |
| Gravity g | 9.81 m/s² |
| Weather grip factor | Clear ×1.0, Fog ×0.9, Heavy rain ×0.6 |

Worked example: at 66 km/h on a dry road, v = 18.33 m/s, so the car needs 9.17 m of reaction distance plus 23.79 m of braking, which is **32.96 m**. A car doing 72 km/h with an object 11 m ahead in fog is CRITICAL. Both cases are unit tests.

### Simulated modifications

| Modification | Effect |
|---|---|
| Performance tires | grip μ +0.10 |
| Upgraded brakes | brake efficiency +0.05 (never above 1.0) |
| Worn tires | grip μ −0.15 |

Performance tires and worn tires cannot be fitted together. Better equipment never makes a scan worse and worn tires never make one better. A test checks this over 300 seeds for every scenario.

## Scenarios

| Scenario | Preset seed | Speed alert | Preset result (stock car) |
|---|---|---|---|
| Highway cruise | 2432 | 110 km/h | 6 safe, 2 warning, 2 critical |
| Rainy city | 1295 | 60 km/h | 5 safe, 3 warning, 2 critical |
| Emergency braking | 3003 | 60 km/h | 7 safe, 1 warning, 2 critical |

Each preset has at least one SAFE, WARNING and CRITICAL scan, and at least half of the scans are SAFE, so an alert still means something. **New seed** explores other runs.

## Project layout

```
index.html            page structure
server.js             tiny static server for `npm start` (no dependencies)
css/style.css         styles, dark and light themes
src/
  config.js           every threshold, vehicle value and modification
  rng.js              seedable random numbers
  engine.js           the rule engine: stopping distance, TTC, alerts (pure functions)
  generator.js        turns a seed and a scenario into 10 sensor scans
  scenarios.js        the three presets
  app.js              connects the modules above to the page
  ui/                 road view, side view, charts, icons
test/                 unit tests (node:test)
scripts/bundle.js     builds dist/index.html
docs/                 screenshots
```

`config.js`, `rng.js`, `engine.js`, `generator.js` and `scenarios.js` never touch the page. The same files run in the browser and in Node, which is why the rules can be tested without a browser.

## Assumptions and limits

- The object ahead is stationary, so closing speed equals the car's own speed and TTC is distance ÷ speed.
- Each scan is generated from the seed. Values move smoothly from scan to scan, but they are not integrated from a vehicle model.
- The vehicle is an original, generic EV sedan. It does not describe any real vehicle and has no brand, badge or logo.
- On the road view, distances use a compressed (square-root) scale so 10 m and 150 m both fit. The tick marks give the real distances.

## Accessibility

The page works with a keyboard (scenario buttons, scan strip, log rows and chart columns), shows status with text and an icon as well as color (warnings are orange, so they never look like the gold accent), has a black and gold theme and an ivory and gold theme, and stops animation when the system asks for reduced motion. Add `?instant` to the address to skip the replay animation.
