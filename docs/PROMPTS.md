----------------------------------------------------------------------

```text
/build-feature

Objective

Build a full-stack calculator application with a React frontend and a backend microservice. The frontend should consume the backend API to perform basic and advanced arithmetic operations. Focus on clean design, maintainable code, and testable architecture.Requirements

--

Functional

Operations:

- Addition
- Subtraction
- Multiplication
- Division
- Exponentiation
- Square Root
- Percentage

Rules:

- I wanna a button to clear the state and start again, this button must be in the red ton exposed in the Frontend section
- There is no parenthesis or other operators in order to change the mathematics operations orders, 
- The operations are gonna be executed in a single API call, after pressing the "=" operator

Frontend (React + TypeScript):

Assumptions

- Intuitive UI for entering input and displaying results
- Responsive design (basic mobile support)

Validation 

- Input validation and error handling
- Only numbers and the allowed operators can exist

Behavior

- The customer can either click on the numbers through the calculator or type the operation he wants
    - If the customer click on the numbrs available in the UI, it's only calculate when clicks on the "="" operator,  there is operations acummulator, i.e after clicking oin 1+1%1
    - If the customer type the numbers + operators, it can acumulate and once press enter, is gonna calculate everything
- For typing, the user must click in the corresponding operators described below
    - Addition: +
    - Subtraction: -
    - Multiplication: *
    - Division: /
    - Exponentiation: ^
    - Square Root: \
    - Percentage: %
- It must exists simple button with ? and show up those keyboard shortcus, it can be the right top button from the calculator
    - Open a moidal with a close button and esc to leasve the modal
- The UI must identify any pressed key, but only numbers and the valid operators will be accepted and validated 
- The final result will be calculated only if the users clicks on = or press enter
- There must have a AC operator that is gonna empty the current calculation status
- The "AC" operator and the "=" operator, must be in red
- It can be used the same color schema as the image on /Users/flaviostudart/Desktop/ui-reference.png
- The result of the operator must replace all the content in the calculation area
    - The last operation (it's gonna be included in the response) can be added above the result, with smaller font
- The result from a previous can be reused for other operations, let's say i send 1+1 and the result is 2, the 2 will be in the calculator to be available sum with other values, if i type / click in +1, it's gonna be 2+1
- You are allowed to invoke /design to build it, also i want to create a new design system in Claude Design under the name seezle-technical-assesment, the design is gonna be handled by this project and must be linked to Claude Design in order to keep the UI organized

You can use MacOS calculator as a base for this development, find the screenshot under /Users/flaviostudart/Desktop/calcualtor.png

Backend (REST API):

- Expose One single endpoint for calculator operations
     - /v1/calculate
         - {
             "operation": ""
         }
- Validate input and handle edge cases (division by zero, invalid data, invalid format)
    - Per invalid format, understand something like 1+1+ (there is an extra + without number after it)
- Return results in JSON format
    {
        "operation": "<original operation>",
        "result": 0
    }
- Use the base structure from dinherim / applyr projects (personal projects under ~/Projects/Personal), the architecture in there are stable and easy to start a new project
    - A single slice "operations" with the handler and use_case for executing the operation will be enough
- Validate the input data, similar as done by the FE, no extra characters other than numbers and the allowed operators
    - 400 Bad request must be triggered in this case
- There is no need for backend complexity, no shared kernel at this moment, a single slice self-containing the required code for the operation is enough
- At the moment, no auth required as ell
- Succcess calcualtions must response 200

Tests

- It must be included Unit Tests and Integration tests, no e2e at the moment, install the libraries you need and you can use the same standards as applyr project

Non-Functional

- Clean, readable, and idiomatic code (frontend and backend)
- Unit tests covering key functionality for both layers
- Documentation: 
    - Setup Instructions
        - Add the instructions to README.md
    - API usage:
        - The project must support Swagger and expose an endpoint to consult all the endpoints
        - Create a Postman Collection named Seezle Test Assessment
        - Create a docs/API.md with the API structure and how to use it
    - Design rationale
        - Create a docs/codebase/DESIGN.md with the design rationale based in Claude Design

- Dockerfile for full-stack deployment + docker-compose loading
    - Select ports that will avoid conflicts with the existing local k3d cluster

Constraints

- Frontend: React + TypeScript
- Backend: Go + Gin
- No DB required in here, no cache, this is a simple

Deliverables

- Git repository with frontend and backend code
    - Create a public repo seezle-test-assessment in GitHub publicly accessible througyh CLI 
    - README with setup instructions, API examples, and design decisions
        - You can summary the information from the deliverables documentation with references to those files
        - Include the repo link and a brief description of the projects rules and features
        - This is gonna read by a Human, no AI, so be consistent and organized
    - Unit tests and coverage report
        - docs/codebase/COVERAGE.md
    - Dockerfile to run frontend + backend together

Session criterias:

- Any prompts did by me must be placed under docs/PROMPTS.md, as a numeric list wit no title, it's a requiremenf of the project i share the prompts i've used
    - Include this in CLAUDE.md to prevent mistakes and refresh the reading of it 
- This is supposede to be a single-shot prompt to build the entire feature, consider the TASK iD SEZ-1, Description: Calculator MVP, branch main and Human Review = no
- The grilling session can be detailed to detect gaps and improvements
- design / design-sync skills are allowed to make sure we have a good UI and keep the design system updated
```

----------------------------------------------------------------------

```text
1. the ui-reference.png file is a reference for the color schema you can use, as you identified
2. It's the percentage, as a real calculator
3. What operator do yoiu suggest for sqrt?
4. Yes, there is negative numbers, add to the scope
5. Yes, good enough
6. Yes
7. Yes, you can add it

--

Onde detail to add to the scope of this task, addd to README.md that i use SDD with grilling notes and specs under each spec folder
```

----------------------------------------------------------------------

```text
About the design, the + must be in the right of the = button
```

----------------------------------------------------------------------

```text
I've noticed you are doing a great job adding the prompts to the docs/PROMPTS.md, but add delimitters in between the prompts and no need for numbered list

i.e

Prompt allalala

A
B

--

Other prompts lala

-- 

Other prompots asdadsd
```

----------------------------------------------------------------------

```text
Add extra delomitters, something bigger like

  ----------------------------------------------------------------------

  SO it's clear it's a new prompt

You can also use coden snippet markdown format to delimiter the prompts
```

----------------------------------------------------------------------

```text
thecode snippet i'm talking about is

​```text
​```
```

----------------------------------------------------------------------

```text
The projecet seems to be working fine, however i'm getting CORS issue as the print below

[Attached screenshot: Screenshot 2026-09-02 at 17.54.09.png]

You can either use Claude in Chrome to debug or check yourself what is going on. Once it's fixed, make sure you add tests to cover this scenario
```

----------------------------------------------------------------------

```text
There are some pending errors happening

1. When an error happen, it shows correctly the Error in the numbers bar, however i need to manually press AC to start using it again, the esc keyboard button must be the shortcut for the AC.
2. \2 is presenting errors, so your tests coverage is not seeing this, fix and add the tests, it should be swaure of 2 right?
3. 8^6*3%9+0 is also presenting errors, why?
4. 10%9 also presenting errors.

Are those math scenarios i'm not convering or some previous decisions we took that are driving to this scenarios ?
```

----------------------------------------------------------------------

```text
Please add to README.md the ocrrect way to use each operator
```

----------------------------------------------------------------------

```text
I want you to run a new round of review and see if you are missing any tsts coverage in Unit and Integration, and the add coverate to E2E, add this to a feature/SEZ-4_tests_check_e2e, open the PR to main when you are done
```