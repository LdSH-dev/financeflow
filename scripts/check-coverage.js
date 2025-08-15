#!/usr/bin/env node
/**
 * Coverage threshold checker
 * Ensures minimum 80% coverage before allowing commits
 */

import { readFileSync, existsSync } from 'fs'
import { exit } from 'process'

const COVERAGE_THRESHOLD = 80

function checkCoverage() {
  const coverageFile = 'coverage/coverage-summary.json'
  
  if (!existsSync(coverageFile)) {
    console.error('❌ Coverage file not found. Please run tests with coverage first.')
    exit(1)
  }

  try {
    const coverage = JSON.parse(readFileSync(coverageFile, 'utf8'))
    const { lines, statements, functions, branches } = coverage.total
    
    const metrics = {
      lines: lines.pct,
      statements: statements.pct,
      functions: functions.pct,
      branches: branches.pct
    }

    console.log('\n📊 Coverage Report:')
    console.log(`Lines:      ${metrics.lines}%`)
    console.log(`Statements: ${metrics.statements}%`)
    console.log(`Functions:  ${metrics.functions}%`)
    console.log(`Branches:   ${metrics.branches}%`)

    const failingMetrics = Object.entries(metrics).filter(
      ([, percentage]) => percentage < COVERAGE_THRESHOLD
    )

    if (failingMetrics.length > 0) {
      console.error(`\n❌ Coverage threshold not met! Minimum required: ${COVERAGE_THRESHOLD}%`)
      console.error('Failing metrics:')
      failingMetrics.forEach(([metric, percentage]) => {
        console.error(`  ${metric}: ${percentage}% (need ${COVERAGE_THRESHOLD}%)`)
      })
      exit(1)
    }

    const overallCoverage = Object.values(metrics).reduce((a, b) => a + b) / 4
    console.log(`\n✅ Overall coverage: ${overallCoverage.toFixed(2)}%`)
    console.log('🎉 All coverage thresholds met!')
    
  } catch (error) {
    console.error('❌ Failed to read coverage file:', error.message)
    exit(1)
  }
}

checkCoverage()