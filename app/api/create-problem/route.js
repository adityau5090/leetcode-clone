import { getJudge0Id, getJudge0LanguageId, pollBatchResult, submitBatch } from "@/lib/judge0";
import { currentUserRole, getCurrentUser } from "@/modules/auth/actions";
import { UserRole } from "@/src/generated/prisma";
import { NextResponse } from "next/server";


export async function POST(request) {
    try {
        const userRole = await currentUserRole();
        const user = await getCurrentUser();

        if(userRole !== UserRole.ADMIN){
            return NextResponse.json(
                {error: "Unauthorized"},
                {status: 401}
            )
        }

        const body = await request.json();

        const {
            title,
            description,
            difficulty,
            examples,
            contraints,
            tags,
            testCases,
            codeSnippets,
            referenceSolution
        } = body;

        if(!title || !description || !difficulty || !testCases || !codeSnippets || !referenceSolution || !contraints){
            return NextResponse.json(
                {error: "Missing required fields"},
                {status: 400}
            )
        }

        if(!Array.isArray(testCases) || testCases.length  === 0){
            return NextResponse.json(
                {error: "At least one test case is required"},
                {status: 400}
            )
        }

        if(!referenceSolution || typeof referenceSolution !== 'object'){
            return NextResponse.json(
                {error: "Reference solution should be provided for all supported language"},
                {status: 400}
            )
        }

        for(const [language, solutionCode] of Object.entries(referenceSolution)){
            // Get Judge0 Language Id for current language
            const languageId = getJudge0LanguageId(language);

            if(!languageId){
                return NextResponse.json(
                    {error: "Unsupported language"},
                    {status: 400}
                )
            }

            // Prepare judge0 submission for all test cases
            const submission = testCases.map((tc) => ({
                source_code: solutionCode,
                language_id: languageId,
                stdin: tc.input,
                expected_output: tc.output
            }))

            // submit all testcase in one batch ( it return tokens )
            const submissionResults = await submitBatch(submission);

            const tokens = submissionResults.map((res) => res.token);

            const results = await pollBatchResult(tokens);

            for(let i=0; i<results.length; i++){
                const result = results[i];

                if(result.status.id !== 3){
                    return NextResponse.json(
                        {
                            error: `Valaditation failed for ${language}`,
                            testCase: {
                                input: submission[i].stdin,
                                expectedOutput: submission[i].expected_output,
                                actualOutput: result.stdout,
                                error: result.stderr || result.compile_output,
                            },
                            details: result,
                        },
                        {status: 400}
                    )
                }
            }
        }

        // save the problem to db
        const newProblem = await db.problem.create({
            data: {
                title,
                description,
                difficulty,
                tags,
                examples,
                contraints,
                testCases,
                codeSnippets,
                referenceSolution,
                userId: user.id,
            }
        })

        return NextResponse.json(
            {
                success: true,
                message: "Problem created successfully",
                data: newProblem,
            },
            {status: 201}
        )
    } catch (error) {
        console.error("Problem creation error : ", error);
        return NextResponse.json(
            {error: "Failed to create problem to database"},
            {status: 500}
        )
    }
}