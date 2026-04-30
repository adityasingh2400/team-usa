# Hackathon FAQ Brief

This brief captures the working constraints from the Team USA x Google Cloud
Hackathon FAQ. Treat this as a build checklist, not legal advice.

## AI And Media

- GenAI images are allowed only if they are animations.
- Do not use real people, real athletes, or any athlete likeness in generated
  media.
- Do not use any athlete name, image, or likeness in the submission output.
- The project may analyze athlete-associated data by name internally, but public
  output must not be individual-level.
- Do not use non-Google generative AI tools to process Team USA data.
- Team USA data processing with generative AI must use Google Cloud tools such
  as Gemini via Vertex AI, Google Cloud analytics services, Cloud Functions, or
  relevant Google APIs.
- The project should primarily use Google Cloud products for implementation.

## Allowed Data

- Publicly available Team USA datasets only.
- Official Team USA website data, including results data, athlete profiles, and
  blog content.
- Open-source repositories with historical athlete performance or macro sports
  data, but only after filtering to Team USA athletes.
- Public weather data such as NOAA.
- Finish placement, such as 1st, 2nd, 3rd.
- Medals.

## Prohibited Data And Media

- Finish times.
- Specific scoring results.
- Team USA multimedia that shows an individual athlete's name, image, or
  likeness.
- Non-Team-USA Olympic or Paralympic data unless filtered to Team USA scope.

## IP And Branding

- Do not use official IOC or USOPC intellectual property.
- Do not use the five-ring logo.
- Do not use official torch imagery.
- Do not use names, photos, or videos of specific Team USA athletes in the
  public product.
- Do not use Games footage.
- Do not use unlicensed music.
- Avoid making "Olympic Games" the app title.
- Focus on sport energy and data-driven insights rather than official branding.

## Terminology

- Use generic terminology where possible.
- Winter Games references must use approved forms such as:
  - "Olympic Winter Games [City] [Year]"
  - "Paralympic Winter Games [City] [Year]"
  - Secondary references: "The Winter Olympics" or "[City] [Year]"
- Summer Games references outside LA should use:
  - "Olympic Games [City] [Year]"
- LA28 references should use:
  - "LA28 Games"
  - "LA28 Olympic and Paralympic Games"
- Never say "former Olympian" or "former Paralympian."
- Use official sport terminology, not National Governing Body names, unless
  prior NGB approval is obtained. Example: use "swimming", not "USA Swimming".

## Required Tech And Deployment

- Gemini API is required and must power core logic or features.
- Google Cloud deployment is required.
- Acceptable hosted surfaces include a web UI, Chrome extension, mobile app, or
  similar functioning demo.
- A hosted project URL is highly encouraged.
- The project should be new for this hackathon, though existing knowledge and
  libraries are allowed.
- The Gemini integration and Google Cloud deployment should be built for this
  challenge.

## Public Repository

- A public code repository is required for judging.
- The repository should include clear testing instructions.
- The repository should demonstrate Google Cloud usage where possible, such as
  code calling Vertex AI endpoints or other Google Cloud services.

## Proving Google Cloud Usage

Acceptable proof can include:

- A screen recording showing the app running on Google Cloud, such as deployment
  console, logs, or service views.
- A link to code in the public repository showing Google Cloud service usage.
- The demo video may be hosted in the GitHub repo or as an unlisted YouTube
  submission video.

## Credits And Cost Control

- Google Cloud access can come from the no-cost trial or an existing account.
- Existing account users may request hackathon credits through the provided
  form.
- Participants are responsible for fees above provided credits.
- Use free tiers where possible, especially Google AI Studio and Cloud Run.
- Set Google Cloud budget alerts.
- Scale down unused deployments.

## Judging And Sharing

- Share the project with judges via website, functioning demo, or test build.
- Private projects can include login credentials in the submission form.
- Judges are not required to test the project and may judge from the text
  description, images, and video alone.
- Do not share the project on social media before or after the hackathon unless
  explicitly authorized.
- Do not publicly share project details, source code, or demo videos on social
  platforms, except for the required unlisted YouTube demo or other authorized
  sponsor-approved sharing.
- Winning does not grant marketing rights or permission to imply sponsorship or
  endorsement by USOPC, Team USA, or LA28.

## Product Implications For Us

- A user trait matcher must output aggregate archetypes, not specific athlete
  matches.
- UI copy should say "could align with", "may be associated with", or
  "historically appears near", not "you are/will be good at".
- Store raw athlete-level data outside public UI and aggregate before display.
- Avoid athlete cards, profile photos, headshots, exact biographies, or named
  recommendations.
- Build the final data processing path around Gemini/Vertex AI and Google Cloud,
  not non-Google AI tools.

